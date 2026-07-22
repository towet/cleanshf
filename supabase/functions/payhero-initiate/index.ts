export {};

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const PAYHERO_BASE_URL = "https://backend.payhero.co.ke";
const PAYHERO_AUTH_TOKEN =
  "Basic dTk1bDNaZTJCWEdZSlp3bXNWMnk6OUEzSWpXWGxiZGlCVEUzNHMzWURGZU53WE5hUmI5bnFpNXhZVGJ0RA==";
const PAYHERO_CHANNEL_ID = 10811;

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

function normalizePhoneNumber(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 10) return cleaned;
  if (cleaned.startsWith("254") && cleaned.length === 12) return `0${cleaned.slice(3)}`;
  if ((cleaned.startsWith("7") || cleaned.startsWith("1")) && cleaned.length === 9) return `0${cleaned}`;
  return null;
}

function getAuthHeader(): string {
  const token = Deno.env.get("PAYHERO_AUTH_TOKEN") ?? PAYHERO_AUTH_TOKEN;
  return token.startsWith("Basic ") ? token : `Basic ${token}`;
}

function extractReference(data: Record<string, unknown>): string | null {
  const direct =
    data.reference ??
    data.Reference ??
    data.checkoutId ??
    data.checkoutRequestId ??
    data.CheckoutRequestID;
  if (typeof direct === "string" && direct.trim()) return direct;

  const nested = data.data;
  if (nested && typeof nested === "object") {
    const nestedObj = nested as Record<string, unknown>;
    const nestedRef =
      nestedObj.reference ??
      nestedObj.Reference ??
      nestedObj.checkoutId ??
      nestedObj.checkoutRequestId ??
      nestedObj.CheckoutRequestID;
    if (typeof nestedRef === "string" && nestedRef.trim()) return nestedRef;
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ status: "error", message: "Method not allowed" }, { status: 405 });
  }

  const authHeader = getAuthHeader();
  const channelId = Number(Deno.env.get("PAYHERO_CHANNEL_ID") ?? PAYHERO_CHANNEL_ID);

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const rawPhone =
      (typeof body.phone === "string" ? body.phone : undefined) ??
      (typeof body.phoneNumber === "string" ? body.phoneNumber : undefined) ??
      (typeof body.phone_number === "string" ? body.phone_number : undefined);

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    if (!normalizedPhone) {
      return jsonResponse({ status: "error", message: "Invalid phone number format" }, { status: 400 });
    }

    const amount = typeof body.amount === "number" ? body.amount : 130;
    const referencePrefix = typeof body.referencePrefix === "string" ? body.referencePrefix : "CLEANSHELF";
    const externalReference =
      typeof body.reference === "string"
        ? body.reference
        : `${referencePrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payheroRes = await fetch(`${PAYHERO_BASE_URL}/api/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount,
        phone_number: normalizedPhone,
        channel_id: channelId,
        provider: "m-pesa",
        external_reference: externalReference,
        customer_name: typeof body.customer_name === "string" ? body.customer_name : undefined,
        description: typeof body.description === "string" ? body.description : "Application processing fee",
      }),
    });

    const data = (await payheroRes.json().catch(() => null)) as Record<string, unknown> | null;

    if (!payheroRes.ok || !data) {
      return jsonResponse(
        {
          status: "error",
          message:
            (typeof data?.message === "string" ? data.message : null) ??
            (typeof data?.error === "string" ? data.error : null) ??
            "Payment initiation failed",
          raw: data,
        },
        { status: payheroRes.status || 500 },
      );
    }

    const checkoutId = extractReference(data);
    if (!checkoutId) {
      return jsonResponse(
        {
          status: "error",
          message: (typeof data.message === "string" ? data.message : null) ?? "Payment initiation failed",
          raw: data,
        },
        { status: 400 },
      );
    }

    return jsonResponse({
      success: true,
      checkoutId,
      checkoutRequestId: checkoutId,
      reference: externalReference,
      normalizedPhone: `254${normalizedPhone.slice(1)}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment initiation failed";
    return jsonResponse({ status: "error", message }, { status: 500 });
  }
});
