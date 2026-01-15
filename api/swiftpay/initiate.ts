const corsHeaders: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-allow-methods": "POST, OPTIONS",
};

declare const process: {
  env: Record<string, string | undefined>;
};

function safeJsonParse(text: string): unknown {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
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
  const swiftpayBaseUrl = process.env.SWIFTPAY_BASE_URL ?? "https://swiftpay-backend-uvv9.onrender.com";

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
  const upstreamJson = safeJsonParse(upstreamText);

  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  return res.status(upstreamRes.status).json(upstreamJson);
}
