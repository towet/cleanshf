const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const PAYHERO_BASE_URL = "https://backend.payhero.co.ke";
const RAW_TOKEN = (
  process.env.PAYHERO_AUTH_TOKEN ||
  "Basic QTV1NEp3S0dzZ1U1VHZvSTVDN1g6UDRaMUx0UnBjalcwUkcxVnNWT3p4ZjVpTG54SzBiQnVWN0tIQ09ETw=="
).trim();
const PAYHERO_AUTH_TOKEN = RAW_TOKEN.startsWith("Basic ") ? RAW_TOKEN : `Basic ${RAW_TOKEN}`;
const PAYHERO_CHANNEL_ID = Number(process.env.PAYHERO_CHANNEL_ID || 11632);

async function parseRequestBody(req: any): Promise<Record<string, any>> {
  if (!req) return {};
  if (req.body) {
    if (typeof req.body === "object" && !Array.isArray(req.body)) {
      return req.body;
    }
    if (typeof req.body === "string" && req.body.trim()) {
      try {
        const parsed = JSON.parse(req.body);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {}
    }
  }

  // Handle incoming stream in Node/Vercel serverless functions
  if (typeof req.on === "function") {
    try {
      const bodyStr = await new Promise<string>((resolve) => {
        let raw = "";
        req.on("data", (chunk: any) => {
          raw += chunk;
        });
        req.on("end", () => resolve(raw));
        req.on("error", () => resolve(""));
      });
      if (bodyStr.trim()) {
        return JSON.parse(bodyStr);
      }
    } catch {}
  }

  return {};
}

function normalizePhoneNumber(phone: string | undefined | null): string | null {
  if (!phone) return null;

  const cleaned = String(phone).replace(/\D/g, "");

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return cleaned;
  }

  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return `0${cleaned.slice(3)}`;
  }

  if ((cleaned.startsWith("7") || cleaned.startsWith("1")) && cleaned.length === 9) {
    return `0${cleaned}`;
  }

  return null;
}

function extractReference(data: Record<string, any>): string | null {
  if (!data) return null;
  const direct =
    data.reference ??
    data.Reference ??
    data.checkoutId ??
    data.checkout_id ??
    data.CheckoutRequestID ??
    data.checkoutRequestId;

  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const nested = data.data;
  if (nested && typeof nested === "object") {
    const nestedObj = nested as Record<string, any>;
    const nestedRef =
      nestedObj.reference ??
      nestedObj.Reference ??
      nestedObj.checkoutId ??
      nestedObj.checkout_id ??
      nestedObj.CheckoutRequestID ??
      nestedObj.checkoutRequestId;
    if (typeof nestedRef === "string" && nestedRef.trim()) return nestedRef.trim();
  }

  return null;
}

export default async function handler(req: any, res: any) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = await parseRequestBody(req);
    const rawPhone = body.phone ?? body.phoneNumber ?? body.phone_number;

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Please provide a valid Kenyan phone number.",
        receivedBody: body,
      });
    }

    const amount = Number(body.amount) || 50;
    const referencePrefix =
      typeof body.referencePrefix === "string" ? body.referencePrefix : "CLEANSHELF";
    const externalReference =
      typeof body.reference === "string"
        ? body.reference
        : `${referencePrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payload = {
      amount,
      phone_number: normalizedPhone,
      channel_id: PAYHERO_CHANNEL_ID,
      provider: "m-pesa",
      external_reference: externalReference,
      customer_name: typeof body.customer_name === "string" ? body.customer_name : undefined,
      description: typeof body.description === "string" ? body.description : "Application processing fee",
    };

    const payheroRes = await fetch(`${PAYHERO_BASE_URL}/api/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: PAYHERO_AUTH_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const data = (await payheroRes.json().catch(() => null)) as Record<string, any> | null;

    if (!payheroRes.ok || !data) {
      return res.status(payheroRes.status || 400).json({
        success: false,
        message:
          (typeof data?.message === "string" ? data.message : null) ??
          (typeof data?.error === "string" ? data.error : null) ??
          "Payment initiation failed with PayHero",
        raw: data,
      });
    }

    const checkoutId = extractReference(data);
    const success =
      data.success === true ||
      String(data.status ?? "").toLowerCase() === "success" ||
      String(data.status ?? "").toLowerCase() === "queued" ||
      Boolean(checkoutId);

    if (!success || !checkoutId) {
      return res.status(400).json({
        success: false,
        message:
          (typeof data.message === "string" ? data.message : null) ??
          "Payment initiation failed",
        raw: data,
      });
    }

    return res.status(200).json({
      success: true,
      checkoutId,
      checkoutRequestId: checkoutId,
      reference: checkoutId,
      externalReference,
      normalizedPhone: `254${normalizedPhone.slice(1)}`,
      message: typeof data.message === "string" ? data.message : "STK push initiated",
      raw: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment initiation failed";
    return res.status(500).json({ success: false, message });
  }
}
