const corsHeaders: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-allow-methods": "POST, OPTIONS",
};

declare const process: {
  env: Record<string, string | undefined>;
};

function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim();
  return trimmed.replace(/\/+$/g, "");
}

function safeJsonParse(text: string): unknown {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function extractMessage(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const anyObj = obj as Record<string, unknown>;
  const msg = anyObj.message ?? anyObj.Message ?? anyObj.error;
  return typeof msg === "string" && msg.trim() !== "" ? msg : undefined;
}

function uniqueStrings(values: string[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    if (!out.includes(v)) out.push(v);
  }
  return out;
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

  const swiftpayApiKey = process.env.SWIFTPAY_API_KEY;
  const swiftpayTillId = process.env.SWIFTPAY_TILL_ID;
  const swiftpayBaseUrl = normalizeBaseUrl(
    process.env.SWIFTPAY_BASE_URL ?? "https://swiftpay-backend-uvv9.onrender.com"
  );

  if (!swiftpayApiKey || !swiftpayTillId) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(500).json({ status: "error", message: "Missing server configuration" });
  }

  const phone_number = typeof req.body?.phone_number === "string" ? req.body.phone_number : undefined;
  const reference = typeof req.body?.reference === "string" ? req.body.reference : undefined;
  const description = typeof req.body?.description === "string" ? req.body.description : undefined;
  const amount = typeof req.body?.amount === "number" ? req.body.amount : 139;

  if (!phone_number) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(400).json({ status: "error", message: "phone_number is required" });
  }

  const endpointPath = "/mpesa/stk-push-api";
  const baseWithApi = /\/api$/i.test(swiftpayBaseUrl) ? swiftpayBaseUrl : `${swiftpayBaseUrl}/api`;
  const baseCandidates = uniqueStrings([swiftpayBaseUrl, swiftpayBaseUrl.replace(/\/api$/i, ""), baseWithApi]);
  const attemptedUrls = baseCandidates.map((b) => `${b}${endpointPath}`);

  const doFetch = (url: string) =>
    fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${swiftpayApiKey}`,
      },
      body: JSON.stringify({
        phone_number,
        amount,
        till_id: swiftpayTillId,
        reference,
        description,
      }),
    });

  let upstreamUrl = attemptedUrls[0];
  let upstreamRes = await doFetch(upstreamUrl);

  for (let i = 1; upstreamRes.status === 404 && i < attemptedUrls.length; i += 1) {
    upstreamUrl = attemptedUrls[i];
    upstreamRes = await doFetch(upstreamUrl);
  }

  const upstreamText = await upstreamRes.text();
  const upstreamJson = safeJsonParse(upstreamText);

  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (!upstreamRes.ok) {
    const message =
      extractMessage(upstreamJson) ??
      `SwiftPay upstream error (${upstreamRes.status}). Check SWIFTPAY_BASE_URL and endpoint.`;
    return res
      .status(upstreamRes.status)
      .json({ status: "error", message, upstreamUrl, attemptedUrls, upstream: upstreamJson });
  }

  return res.status(200).json(upstreamJson);
}
