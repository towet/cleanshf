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

function extractResultCode(obj: unknown): number | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  const anyObj = obj as Record<string, unknown>;

  const direct = anyObj.ResultCode ?? anyObj.resultCode ?? anyObj.result_code;
  if (typeof direct === "number") return direct;
  if (typeof direct === "string" && direct.trim() !== "" && !Number.isNaN(Number(direct))) return Number(direct);

  const payment = anyObj.payment;
  if (payment && typeof payment === "object") {
    const pObj = payment as Record<string, unknown>;
    const pDirect = pObj.ResultCode ?? pObj.resultCode ?? pObj.result_code;
    if (typeof pDirect === "number") return pDirect;
    if (typeof pDirect === "string" && pDirect.trim() !== "" && !Number.isNaN(Number(pDirect))) return Number(pDirect);
  }

  const data = anyObj.data;
  if (data && typeof data === "object") {
    const dObj = data as Record<string, unknown>;
    const dDirect = dObj.ResultCode ?? dObj.resultCode ?? dObj.result_code;
    if (typeof dDirect === "number") return dDirect;
    if (typeof dDirect === "string" && dDirect.trim() !== "" && !Number.isNaN(Number(dDirect))) return Number(dDirect);
  }

  const body = anyObj.Body;
  if (body && typeof body === "object") {
    const stkCallback = (body as Record<string, unknown>).stkCallback;
    if (stkCallback && typeof stkCallback === "object") {
      const nested = (stkCallback as Record<string, unknown>).ResultCode;
      if (typeof nested === "number") return nested;
      if (typeof nested === "string" && nested.trim() !== "" && !Number.isNaN(Number(nested))) return Number(nested);
    }
  }

  return undefined;
}

function extractStateNumber(obj: unknown): number | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  const anyObj = obj as Record<string, unknown>;
  const direct = anyObj.state ?? anyObj.State;
  if (typeof direct === "number") return direct;
  if (typeof direct === "string" && direct.trim() !== "" && !Number.isNaN(Number(direct))) return Number(direct);

  const data = anyObj.data;
  if (data && typeof data === "object") {
    const nested = (data as Record<string, unknown>).state ?? (data as Record<string, unknown>).State;
    if (typeof nested === "number") return nested;
    if (typeof nested === "string" && nested.trim() !== "" && !Number.isNaN(Number(nested))) return Number(nested);
  }

  return undefined;
}

function extractStatusString(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const anyObj = obj as Record<string, unknown>;

  const direct = anyObj.status ?? anyObj.Status;
  if (typeof direct === "string" && direct.trim() !== "") return direct;

  const payment = anyObj.payment;
  if (payment && typeof payment === "object") {
    const pStatus = (payment as Record<string, unknown>).status ?? (payment as Record<string, unknown>).Status;
    if (typeof pStatus === "string" && pStatus.trim() !== "") return pStatus;
  }

  const data = anyObj.data;
  if (data && typeof data === "object") {
    const dStatus = (data as Record<string, unknown>).status ?? (data as Record<string, unknown>).Status;
    if (typeof dStatus === "string" && dStatus.trim() !== "") return dStatus;
  }

  return undefined;
}

function computeState(upstream: unknown): "success" | "pending" | "failed" {
  const stateNumber = extractStateNumber(upstream);
  if (stateNumber === 0) return "success";
  if (typeof stateNumber === "number" && stateNumber > 0) return "failed";

  const rc = extractResultCode(upstream);
  if (rc === 0) return "success";
  if (rc === 4999) return "pending";
  if (typeof rc === "number" && rc > 0) return "failed";

  if (upstream && typeof upstream === "object") {
    const anyObj = upstream as Record<string, unknown>;
    const s = extractStatusString(upstream);
    if (typeof s === "string") {
      const lowered = s.toLowerCase();
      if (lowered === "success" || lowered === "completed") return "success";
      if (lowered === "failed" || lowered === "error" || lowered === "cancelled" || lowered === "canceled")
        return "failed";
      if (lowered === "processing" || lowered === "pending") return "pending";
    }
  }

  return "pending";
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
  const swiftpayBaseUrl = normalizeBaseUrl(
    process.env.SWIFTPAY_BASE_URL ?? "https://swiftpay-backend-uvv9.onrender.com"
  );

  if (!swiftpayApiKey) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(500).json({ status: "error", message: "Missing server configuration" });
  }

  const checkoutRequestId = typeof req.body?.checkoutRequestId === "string" ? req.body.checkoutRequestId : undefined;
  const checkoutId = typeof req.body?.checkoutId === "string" ? req.body.checkoutId : checkoutRequestId;

  if (!checkoutId) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(400).json({ status: "error", message: "checkoutRequestId (or checkoutId) is required" });
  }

  const endpointPath = "/mpesa-verification-proxy";
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
      body: JSON.stringify({ checkoutId, checkoutRequestId }),
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
      .json({ state: "failed", message, upstreamUrl, attemptedUrls, upstream: upstreamJson });
  }

  return res.status(200).json({ state: computeState(upstreamJson), upstream: upstreamJson });
}
