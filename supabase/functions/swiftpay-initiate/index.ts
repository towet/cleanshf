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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ status: "error", message: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
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
      return jsonResponse(
        {
          status: "error",
          message: "Invalid phone number format. Use 07XXXXXXXX, 011XXXXXXX, 254..., or +254...",
        },
        { status: 400 },
      );
    }

    const swiftPayApiKey =
      Deno.env.get("SWIFTPAY_API_KEY") ?? "sp_fb3266cf-164b-42a2-903c-c18fbc82b806";
    const swiftPayTillId =
      Deno.env.get("SWIFTPAY_TILL_ID") ?? "7b98fd1c-3776-45d1-bf9b-94ac571344ac";
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

    if (!responseData) {
      return jsonResponse(
        {
          status: "error",
          message: `Payment service returned an invalid response (${response.status}).`,
        },
        { status: 502 },
      );
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
      return jsonResponse(
        {
          status: "error",
          message:
            responseData?.message ||
            responseData?.CustomerMessage ||
            `Failed to initiate payment (${response.status})`,
        },
        { status: response.ok ? 400 : response.status },
      );
    }

    return jsonResponse({
      success: true,
      checkoutRequestId,
      normalizedPhone,
      reference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to initiate payment.";
    return jsonResponse({ status: "error", message }, { status: 500 });
  }
});
