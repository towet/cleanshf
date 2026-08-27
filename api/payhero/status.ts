const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const PAYHERO_BASE_URL = "https://backend.payhero.co.ke";
const PAYHERO_AUTH_TOKEN =
  process.env.PAYHERO_AUTH_TOKEN ||
  "Basic QTV1NEp3S0dzZ1U1VHZvSTVDN1g6UDRaMUx0UnBjalcwUkcxVnNWT3p4ZjVpTG54SzBiQnVWN0tIQ09ETw==";

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

function mapPayheroStatus(rawStatus: string): "paid" | "failed" | "pending" {
  const status = rawStatus.toUpperCase();

  if (status === "SUCCESS" || status === "COMPLETED" || status === "PAID") {
    return "paid";
  }

  if (status === "FAILED" || status === "CANCELLED" || status === "CANCELED") {
    return "failed";
  }

  return "pending";
}

export default async function handler(req: any, res: any) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = await parseRequestBody(req);
    const query = req.query || {};

    const reference =
      (typeof body.checkoutId === "string" ? body.checkoutId : undefined) ??
      (typeof body.checkoutRequestId === "string" ? body.checkoutRequestId : undefined) ??
      (typeof body.reference === "string" ? body.reference : undefined) ??
      (typeof query.checkoutId === "string" ? query.checkoutId : undefined) ??
      (typeof query.reference === "string" ? query.reference : undefined);

    if (!reference) {
      return res.status(400).json({ status: "error", message: "Missing checkoutId or reference" });
    }

    const payheroRes = await fetch(
      `${PAYHERO_BASE_URL}/api/v2/transaction-status?reference=${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: PAYHERO_AUTH_TOKEN,
        },
      },
    );

    const data = (await payheroRes.json().catch(() => null)) as Record<string, any> | null;

    if (!payheroRes.ok || !data) {
      return res.status(payheroRes.status || 400).json({
        status: "error",
        message:
          (typeof data?.error_message === "string" ? data.error_message : null) ??
          (typeof data?.message === "string" ? data.message : null) ??
          (typeof data?.error === "string" ? data.error : null) ??
          "Status check failed",
        raw: data,
      });
    }

    const rawStatus = String(data.status ?? data.Status ?? "").trim();
    const mappedStatus = mapPayheroStatus(rawStatus);
    const success = data.success === true || mappedStatus === "paid";

    return res.status(200).json({
      success,
      status: mappedStatus,
      state: mappedStatus === "paid" ? "success" : mappedStatus === "failed" ? "failed" : "pending",
      rawStatus,
      resultDesc:
        (typeof data.message === "string" ? data.message : "") ||
        (typeof data.resultDesc === "string" ? data.resultDesc : "") ||
        rawStatus,
      receiptNumber:
        (typeof data.payment_reference === "string" && data.payment_reference ? data.payment_reference : null) ??
        (typeof data.third_party_reference === "string" && data.third_party_reference ? data.third_party_reference : null) ??
        (typeof data.provider_reference === "string" && data.provider_reference ? data.provider_reference : null),
      raw: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status check failed";
    return res.status(500).json({ status: "error", message });
  }
}
