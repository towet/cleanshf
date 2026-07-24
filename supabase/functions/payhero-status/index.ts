export {};

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const PAYHERO_BASE_URL = "https://backend.payhero.co.ke";

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

function getAuthHeader(): string | null {
  const token = Deno.env.get("PAYHERO_AUTH_TOKEN")?.trim();
  if (token) {
    return token.startsWith("Basic ") ? token : `Basic ${token}`;
  }

  const username = Deno.env.get("PAYHERO_API_USERNAME")?.trim();
  const password = Deno.env.get("PAYHERO_API_PASSWORD")?.trim();
  if (username && password) {
    return `Basic ${btoa(`${username}:${password}`)}`;
  }

  return null;
}

function mapPayheroStatus(rawStatus: string): "paid" | "failed" | "pending" {
  const status = rawStatus.toUpperCase();
  if (status === "SUCCESS" || status === "COMPLETED" || status === "PAID") return "paid";
  if (status === "FAILED" || status === "CANCELLED" || status === "CANCELED") return "failed";
  return "pending";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ status: "error", message: "Method not allowed" }, { status: 405 });
  }

  const authHeader = getAuthHeader();
  if (!authHeader) {
    return jsonResponse(
      {
        status: "error",
        message:
          "PayHero is not configured. Set PAYHERO_AUTH_TOKEN (or PAYHERO_API_USERNAME + PAYHERO_API_PASSWORD).",
      },
      { status: 500 },
    );
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const reference =
      (typeof body.checkoutId === "string" ? body.checkoutId : undefined) ??
      (typeof body.checkoutRequestId === "string" ? body.checkoutRequestId : undefined) ??
      (typeof body.reference === "string" ? body.reference : undefined);

    if (!reference) {
      return jsonResponse({ status: "error", message: "Missing checkoutId/reference" }, { status: 400 });
    }

    const payheroRes = await fetch(
      `${PAYHERO_BASE_URL}/api/v2/transaction-status?reference=${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: { Authorization: authHeader },
      },
    );

    const data = (await payheroRes.json().catch(() => null)) as Record<string, unknown> | null;

    if (!payheroRes.ok || !data) {
      return jsonResponse(
        {
          status: "error",
          message:
            (typeof data?.message === "string" ? data.message : null) ??
            (typeof data?.error === "string" ? data.error : null) ??
            "Status check failed",
          raw: data,
        },
        { status: payheroRes.status || 500 },
      );
    }

    const rawStatus = String(data.status ?? data.Status ?? "").trim();
    const mappedStatus = mapPayheroStatus(rawStatus);

    return jsonResponse({
      success: data.success === true || mappedStatus === "paid",
      status: mappedStatus,
      state: mappedStatus === "paid" ? "success" : mappedStatus === "failed" ? "failed" : "pending",
      rawStatus,
      resultDesc:
        (typeof data.message === "string" ? data.message : "") ||
        (typeof data.resultDesc === "string" ? data.resultDesc : "") ||
        rawStatus,
      receiptNumber:
        (typeof data.provider_reference === "string" ? data.provider_reference : null) ??
        (typeof data.third_party_reference === "string" ? data.third_party_reference : null),
      raw: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status check failed";
    return jsonResponse({ status: "error", message }, { status: 500 });
  }
});
