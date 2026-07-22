const corsHeaders: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-allow-methods": "POST, OPTIONS",
};

function parseJsonSafely(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeKenyanPhoneNumber(input: string): string | null {
  const digitsOnly = input.replace(/\D/g, "");
  if (!digitsOnly) return null;
  if (/^254(7\d{8}|1\d{8})$/.test(digitsOnly)) return digitsOnly;
  if (/^(7\d{8}|1\d{8})$/.test(digitsOnly)) return `254${digitsOnly}`;
  if (/^0(7\d{8}|1\d{8})$/.test(digitsOnly)) return `254${digitsOnly.slice(1)}`;
  return null;
}

function parseBody(req: { body?: unknown }): Record<string, unknown> {
  const raw = req.body;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).send("ok");
  }

  if (req.method !== "POST") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    const body = parseBody(req);
    const phoneInput =
      (typeof body.phoneNumber === "string" ? body.phoneNumber : undefined) ??
      (typeof body.phone_number === "string" ? body.phone_number : undefined);
    const amount = typeof body.amount === "number" ? body.amount : 130;
    const description =
      typeof body.description === "string" ? body.description : "Application processing fee";
    const referencePrefix =
      typeof body.referencePrefix === "string" ? body.referencePrefix : "CLEANSHELF";
    const reference =
      typeof body.reference === "string"
        ? body.reference
        : `${referencePrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const normalizedPhone = phoneInput ? normalizeKenyanPhoneNumber(phoneInput) : null;
    if (!normalizedPhone) {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(400).json({
        status: "error",
        message: "Invalid phone number format. Use 07XXXXXXXX, 011XXXXXXX, 254..., or +254...",
      });
    }

    const swiftPayApiKey =
      process.env.SWIFTPAY_API_KEY ?? "sp_fb3266cf-164b-42a2-903c-c18fbc82b806";
    const swiftPayTillId =
      process.env.SWIFTPAY_TILL_ID ?? "7b98fd1c-3776-45d1-bf9b-94ac571344ac";
    const response = await fetch("https://swiftpay-backend-uvv9.onrender.com/api/mpesa/stk-push-api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${swiftPayApiKey}`,
      },
      body: JSON.stringify({
        phone_number: normalizedPhone,
        amount,
        till_id: swiftPayTillId,
        reference,
        description,
      }),
    });

    const responseText = await response.text();
    const responseData = parseJsonSafely(responseText);

    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

    if (!responseData) {
      return res.status(502).json({
        status: "error",
        message: `Payment service returned an invalid response (${response.status}).`,
      });
    }

    const checkoutRequestId =
      responseData?.data?.checkout_id ??
      responseData?.data?.checkoutRequestId ??
      responseData?.data?.checkoutRequestID ??
      responseData?.checkout_id ??
      responseData?.checkoutRequestId ??
      responseData?.checkoutRequestID ??
      null;

    if (!response.ok || responseData?.status === "error" || !checkoutRequestId) {
      return res.status(response.ok ? 400 : response.status).json({
        status: "error",
        message:
          responseData?.message ||
          responseData?.CustomerMessage ||
          `Failed to initiate payment (${response.status})`,
      });
    }

    return res.status(200).json({
      success: true,
      checkoutRequestId,
      normalizedPhone,
      reference,
    });
  } catch (err) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    const message = err instanceof Error ? err.message : "Failed to initiate payment.";
    return res.status(500).json({ status: "error", message });
  }
}
