export {};

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const corsHeaders: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

function extractResultCode(obj: unknown): number | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  const anyObj = obj as Record<string, unknown>;

  const direct = anyObj.ResultCode ?? anyObj.resultCode ?? anyObj.result_code;
  if (typeof direct === "number") return direct;
  if (typeof direct === "string" && direct.trim() !== "" && !Number.isNaN(Number(direct))) return Number(direct);

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

function computeState(upstream: unknown): "success" | "pending" | "failed" {
  const rc = extractResultCode(upstream);
  if (rc === 0) return "success";
  if (typeof rc === "number" && rc > 0) return "failed";

  if (upstream && typeof upstream === "object") {
    const anyObj = upstream as Record<string, unknown>;
    const s = anyObj.status;
    if (typeof s === "string") {
      const lowered = s.toLowerCase();
      if (lowered === "success") return "success";
      if (lowered === "failed" || lowered === "error") return "failed";
    }
  }

  return "pending";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ status: "error", message: "Method not allowed" }, { status: 405 });
  }

  const swiftpayApiKey = Deno.env.get("SWIFTPAY_API_KEY");
  const swiftpayBaseUrl = Deno.env.get("SWIFTPAY_BASE_URL") ?? "https://swiftpay-backend-uvv9.onrender.com";

  if (!swiftpayApiKey) {
    return jsonResponse({ status: "error", message: "Missing server configuration" }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ status: "error", message: "Invalid JSON body" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const checkoutRequestId = typeof body.checkoutRequestId === "string" ? body.checkoutRequestId : undefined;

  if (!checkoutRequestId) {
    return jsonResponse({ status: "error", message: "checkoutRequestId is required" }, { status: 400 });
  }

  const upstreamRes = await fetch(`${swiftpayBaseUrl}/mpesa-verification-proxy`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${swiftpayApiKey}`,
    },
    body: JSON.stringify({ checkoutRequestId }),
  });

  const upstreamText = await upstreamRes.text();
  let upstreamJson: unknown = upstreamText;
  try {
    upstreamJson = upstreamText ? JSON.parse(upstreamText) : {};
  } catch {
    upstreamJson = { raw: upstreamText };
  }

  if (!upstreamRes.ok) {
    return jsonResponse({ state: "failed", upstream: upstreamJson }, { status: upstreamRes.status });
  }

  return jsonResponse({ state: computeState(upstreamJson), upstream: upstreamJson }, { status: 200 });
});
