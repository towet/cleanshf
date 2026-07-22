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

export async function initiateMpesaPayment(
  data: InitiateMpesaPaymentInput,
): Promise<InitiateMpesaPaymentResult> {
  const normalizedPhone = normalizeKenyanPhoneNumber(data.phoneNumber);

  if (!normalizedPhone) {
    throw new Error("Invalid phone number format. Use 07XXXXXXXX, 011XXXXXXX, 254..., or +254...");
  }

  const response = await fetch("/api/payhero/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: data.phoneNumber,
      phoneNumber: data.phoneNumber,
      amount: data.amount,
      description: data.description ?? "Application processing fee",
      referencePrefix: data.referencePrefix ?? "CLEANSHELF",
      customer_name: data.customerName,
    }),
  });

  let responseData: Record<string, unknown> | null = null;
  try {
    responseData = (await response.json()) as Record<string, unknown>;
  } catch {
    throw new Error(`Payment service returned an invalid response (${response.status}).`);
  }

  if (!responseData) {
    throw new Error(`Payment service returned an invalid response (${response.status}).`);
  }

  const checkoutRequestId =
    (typeof responseData.checkoutId === "string" ? responseData.checkoutId : null) ??
    (typeof responseData.checkoutRequestId === "string" ? responseData.checkoutRequestId : null);

  if (!response.ok || responseData.success === false || !checkoutRequestId) {
    throw new Error(
      (typeof responseData.message === "string" ? responseData.message : null) ??
        `Failed to initiate payment (${response.status})`,
    );
  }

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

export async function checkMpesaPaymentStatus(
  checkoutRequestId: string,
): Promise<CheckMpesaPaymentStatusResult> {
  const response = await fetch("/api/payhero/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkoutId: checkoutRequestId }),
  });

  let responseData: Record<string, unknown> | null = null;
  try {
    responseData = (await response.json()) as Record<string, unknown>;
  } catch {
    throw new Error("Failed to verify payment status.");
  }

  if (!response.ok || !responseData || responseData.status === "error") {
    throw new Error(
      (typeof responseData?.message === "string" ? responseData.message : null) ??
        "Failed to verify payment status.",
    );
  }

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
