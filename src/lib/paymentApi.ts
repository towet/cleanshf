export function normalizeKenyanPhoneNumber(input: string): string | null {
  const digitsOnly = input.replace(/\D/g, "");
  if (!digitsOnly) return null;
  if (/^254(7\d{8}|1\d{8})$/.test(digitsOnly)) return digitsOnly;
  if (/^(7\d{8}|1\d{8})$/.test(digitsOnly)) return `254${digitsOnly}`;
  if (/^0(7\d{8}|1\d{8})$/.test(digitsOnly)) return `254${digitsOnly.slice(1)}`;
  return null;
}

export function isValidKenyanPhoneNumber(input: string): boolean {
  return normalizeKenyanPhoneNumber(input) !== null;
}

export type PaymentStatus = "pending" | "success" | "failed" | "timeout";

export type InitiateMpesaPaymentInput = {
  phoneNumber: string;
  amount: number;
  description?: string;
  referencePrefix?: string;
  customerName?: string;
};

export type InitiateMpesaPaymentResult = {
  success: true;
  checkoutRequestId: string;
  normalizedPhone: string;
  reference: string;
};

export type CheckMpesaPaymentStatusResult = {
  success: boolean;
  status: PaymentStatus;
  rawStatus: string;
  resultDesc: string;
  receiptNumber: string | null;
};

const DIRECT_AUTH_TOKEN =
  "Basic QTV1NEp3S0dzZ1U1VHZvSTVDN1g6UDRaMUx0UnBjalcwUkcxVnNWT3p4ZjVpTG54SzBiQnVWN0tIQ09ETw==";
const DIRECT_CHANNEL_ID = 11632;
const PAYHERO_BASE_URL = "https://backend.payhero.co.ke";

export async function initiateMpesaPayment(
  data: InitiateMpesaPaymentInput,
): Promise<InitiateMpesaPaymentResult> {
  const normalizedPhone = normalizeKenyanPhoneNumber(data.phoneNumber);

  if (!normalizedPhone) {
    throw new Error("Invalid phone number format. Use 07XXXXXXXX, 011XXXXXXX, 254..., or +254...");
  }

  // 1. Try serverless /api/payhero/initiate first
  let lastError: string | null = null;
  try {
    const response = await fetch("/api/payhero/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: data.phoneNumber,
        phoneNumber: data.phoneNumber,
        phone_number: normalizedPhone,
        amount: data.amount,
        description: data.description ?? "Application processing fee",
        referencePrefix: data.referencePrefix ?? "CLEANSHELF",
        customer_name: data.customerName,
      }),
    });

    if (response.ok) {
      const responseData = (await response.json()) as Record<string, unknown>;
      const checkoutRequestId =
        (typeof responseData.checkoutId === "string" ? responseData.checkoutId : null) ??
        (typeof responseData.checkoutRequestId === "string" ? responseData.checkoutRequestId : null);

      if (responseData.success !== false && checkoutRequestId) {
        return {
          success: true,
          checkoutRequestId,
          normalizedPhone:
            typeof responseData.normalizedPhone === "string" ? responseData.normalizedPhone : normalizedPhone,
          reference:
            typeof responseData.reference === "string"
              ? responseData.reference
              : `${data.referencePrefix ?? "CLEANSHELF"}-${Date.now()}`,
        };
      }
    } else {
      const errJson = await response.json().catch(() => null);
      if (errJson && typeof errJson.message === "string") {
        lastError = errJson.message;
      }
    }
  } catch (err) {
    lastError = err instanceof Error ? err.message : null;
  }

  // 2. Direct fallback to PayHero API
  try {
    const extRef = `${data.referencePrefix ?? "CLEANSHELF"}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const directRes = await fetch(`${PAYHERO_BASE_URL}/api/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: DIRECT_AUTH_TOKEN,
      },
      body: JSON.stringify({
        amount: data.amount,
        phone_number: normalizedPhone.startsWith("254") ? `0${normalizedPhone.slice(3)}` : normalizedPhone,
        channel_id: DIRECT_CHANNEL_ID,
        provider: "m-pesa",
        external_reference: extRef,
        customer_name: data.customerName,
        description: data.description ?? "Application processing fee",
      }),
    });

    const directData = (await directRes.json().catch(() => null)) as Record<string, any> | null;

    if (directRes.ok && directData) {
      const ref =
        (typeof directData.reference === "string" ? directData.reference : null) ??
        (typeof directData.CheckoutRequestID === "string" ? directData.CheckoutRequestID : null) ??
        (typeof directData.checkoutRequestId === "string" ? directData.checkoutRequestId : null);

      if (ref) {
        return {
          success: true,
          checkoutRequestId: ref,
          normalizedPhone,
          reference: ref,
        };
      }
    }

    if (directData && (directData.message || directData.error)) {
      throw new Error(String(directData.message || directData.error));
    }
  } catch (directErr) {
    if (directErr instanceof Error && directErr.message) {
      throw directErr;
    }
  }

  throw new Error(lastError || "Failed to initiate payment. Please check your phone number and try again.");
}

export async function checkMpesaPaymentStatus(
  checkoutRequestId: string,
): Promise<CheckMpesaPaymentStatusResult> {
  // 1. Try /api/payhero/status
  try {
    const response = await fetch("/api/payhero/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkoutId: checkoutRequestId, reference: checkoutRequestId }),
    });

    if (response.ok) {
      const responseData = (await response.json()) as Record<string, any>;
      if (responseData && responseData.status !== "error") {
        const rawStatus = String(responseData.rawStatus ?? responseData.status ?? "").toLowerCase();
        const resultDesc =
          (typeof responseData.resultDesc === "string" ? responseData.resultDesc : "") ||
          (typeof responseData.message === "string" ? responseData.message : "");
        const receiptNumber =
          (typeof responseData.receiptNumber === "string" ? responseData.receiptNumber : null) ?? null;

        let status: PaymentStatus = "pending";
        const responseStatus = String(responseData.status ?? responseData.state ?? "").toLowerCase();

        if (responseStatus === "paid" || responseStatus === "success") {
          status = "success";
        } else if (responseStatus === "failed") {
          status = "failed";
        } else if (rawStatus === "success" || rawStatus === "completed" || rawStatus === "paid") {
          status = "success";
        } else if (rawStatus === "failed" || rawStatus === "cancelled" || rawStatus === "canceled") {
          status = "failed";
        }

        return {
          success: responseData.success !== false,
          status,
          rawStatus,
          resultDesc,
          receiptNumber,
        };
      }
    }
  } catch {}

  // 2. Direct fallback status check
  try {
    const directRes = await fetch(
      `${PAYHERO_BASE_URL}/api/v2/transaction-status?reference=${encodeURIComponent(checkoutRequestId)}`,
      {
        method: "GET",
        headers: {
          Authorization: DIRECT_AUTH_TOKEN,
        },
      },
    );

    if (directRes.ok) {
      const directData = (await directRes.json()) as Record<string, any>;
      const rawStatus = String(directData.status ?? directData.Status ?? "").toLowerCase();
      let status: PaymentStatus = "pending";

      if (rawStatus === "success" || rawStatus === "completed" || rawStatus === "paid") {
        status = "success";
      } else if (rawStatus === "failed" || rawStatus === "cancelled" || rawStatus === "canceled") {
        status = "failed";
      }

      return {
        success: directData.success === true || status === "success",
        status,
        rawStatus,
        resultDesc: typeof directData.message === "string" ? directData.message : rawStatus,
        receiptNumber:
          (typeof directData.payment_reference === "string" && directData.payment_reference ? directData.payment_reference : null) ??
          (typeof directData.third_party_reference === "string" && directData.third_party_reference ? directData.third_party_reference : null) ??
          (typeof directData.provider_reference === "string" && directData.provider_reference ? directData.provider_reference : null),
      };
    }
  } catch {}

  return {
    success: true,
    status: "pending",
    rawStatus: "pending",
    resultDesc: "Waiting for M-PESA confirmation...",
    receiptNumber: null,
  };
}
