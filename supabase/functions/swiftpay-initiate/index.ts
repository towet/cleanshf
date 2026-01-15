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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ status: "error", message: "Method not allowed" }, { status: 405 });
  }

  const swiftpayApiKey = Deno.env.get("SWIFTPAY_API_KEY");
  const swiftpayTillId = Deno.env.get("SWIFTPAY_TILL_ID");
  const swiftpayBaseUrl = Deno.env.get("SWIFTPAY_BASE_URL") ?? "https://swiftpay-backend-uvv9.onrender.com";

  if (!swiftpayApiKey || !swiftpayTillId) {
    return jsonResponse({ status: "error", message: "Missing server configuration" }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ status: "error", message: "Invalid JSON body" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const phone_number = typeof body.phone_number === "string" ? body.phone_number : undefined;
  const reference = typeof body.reference === "string" ? body.reference : undefined;
  const description = typeof body.description === "string" ? body.description : undefined;
  const amount = typeof body.amount === "number" ? body.amount : 139;

  if (!phone_number) {
    return jsonResponse({ status: "error", message: "phone_number is required" }, { status: 400 });
  }

  const upstreamRes = await fetch(`${swiftpayBaseUrl}/mpesa/stk-push-api`, {
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

  const upstreamText = await upstreamRes.text();
  let upstreamJson: unknown = upstreamText;
  try {
    upstreamJson = upstreamText ? JSON.parse(upstreamText) : {};
  } catch {
    upstreamJson = { raw: upstreamText };
  }

  if (!upstreamRes.ok) {
    return jsonResponse(upstreamJson, { status: upstreamRes.status });
  }

  return jsonResponse(upstreamJson, { status: 200 });
});
