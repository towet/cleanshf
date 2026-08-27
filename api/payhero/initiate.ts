const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const PAYHERO_BASE_URL = "https://backend.payhero.co.ke";

async function parseBody(req: any): Promise<Record<string, unknown>> {
  if (!req) return {};
  let raw = req.body;

  if (Buffer.isBuffer(raw)) {
    try {
      raw = JSON.parse(raw.toString("utf8"));
    } catch {}
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {}
  }

  if (typeof req.on === "function") {
    try {
      const bodyStr = await new Promise<string>((resolve) => {
        let acc = "";
        req.on("data", (chunk: any) => { acc += chunk; });
        req.on("end", () => resolve(acc));
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

  // If already in international format (e.g., 254712345678 or 254112345678)
  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return cleaned;
  }

  // If starts with a leading zero (e.g., 0712345678 or 0112345678)
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "254" + cleaned.slice(1);
  }

  // If local Kenya format without leading zero (e.g., 712345678 or 112345678)
  if ((cleaned.startsWith("7") || cleaned.startsWith("1")) && cleaned.length === 9) {
    return "254" + cleaned;
  }

  return null;
}

function getAuthHeader(): string {
  const token = process.env.PAYHERO_AUTH_TOKEN?.trim() || "Basic QTV1NEp3S0dzZ1U1VHZvSTVDN1g6UDRaMUx0UnBjalcwUkcxVnNWT3p4ZjVpTG54SzBiQnVWN0tIQ09ETw==";
  if (token) {
    return token.startsWith("Basic ") ? token : `Basic ${token}`;
  }

  const username = process.env.PAYHERO_API_USERNAME?.trim() || "A5u4JwKGsgU5TvoI5C7X";
  const password = process.env.PAYHERO_API_PASSWORD?.trim() || "P4Z1LtRpcjW0RG1VsVOzxf5iLnxK0bBuV7KHCODO";
  if (username && password) {
    return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  return "Basic QTV1NEp3S0dzZ1U1VHZvSTVDN1g6UDRaMUx0UnBjalcwUkcxVnNWT3p4ZjVpTG54SzBiQnVWN0tIQ09ETw==";
}

function getChannelId(): number {
  const raw = process.env.PAYHERO_CHANNEL_ID?.trim();
  if (!raw) return 11632;
  const channelId = Number(raw);
  return Number.isFinite(channelId) && channelId > 0 ? channelId : 11632;
}

function extractReference(data: Record<string, unknown>): string | null {
  const direct =
    data.CheckoutRequestID ??
    data.checkoutRequestId ??
    data.checkoutId ??
    data.reference ??
    data.Reference;

  if (typeof direct === "string" && direct.trim()) return direct;

  const nested = data.data;
  if (nested && typeof nested === "object") {
    const nestedObj = nested as Record<string, unknown>;
    const nestedRef =
      nestedObj.CheckoutRequestID ??
      nestedObj.checkoutRequestId ??
      nestedObj.checkoutId ??
      nestedObj.reference ??
      nestedObj.Reference;
    if (typeof nestedRef === "string" && nestedRef.trim()) return nestedRef;
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

  const authHeader = getAuthHeader();
  const channelId = getChannelId();

  try {
    const body = await parseBody(req);
    const rawPhone =
      (typeof body.phone === "string" ? body.phone : undefined) ??
      (typeof body.phoneNumber === "string" ? body.phoneNumber : undefined) ??
      (typeof body.phone_number === "string" ? body.phone_number : undefined);

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: "Invalid phone number format" });
    }

    const amount = Number(body.amount) || 130;

    const referencePrefix =
      typeof body.referencePrefix === "string" ? body.referencePrefix : "CLEANSHELF";
    const externalReference =
      typeof body.reference === "string"
        ? body.reference
        : `${referencePrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payload = {
      amount,
      phone_number: normalizedPhone,
      channel_id: channelId,
      provider: "m-pesa",
      external_reference: externalReference,
      customer_name: typeof body.customer_name === "string" ? body.customer_name : undefined,
      description: typeof body.description === "string" ? body.description : "Application processing fee",
    };

    const payheroRes = await fetch(`${PAYHERO_BASE_URL}/api/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = (await payheroRes.json().catch(() => null)) as Record<string, unknown> | null;

    if (!payheroRes.ok || !data) {
      return res.status(payheroRes.status || 500).json({
        success: false,
        message:
          (typeof data?.message === "string" ? data.message : null) ??
          (typeof data?.error === "string" ? data.error : null) ??
          "Payment initiation failed",
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
      reference: externalReference,
      normalizedPhone: normalizedPhone,
      message: typeof data.message === "string" ? data.message : "STK push initiated",
      raw: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment initiation failed";
    return res.status(500).json({ success: false, message });
  }
}
