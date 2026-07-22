export {};

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

type PaymentStatus = "pending" | "success" | "failed" | "timeout";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ status: "error", message: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const checkoutRequestId =
      typeof body.checkoutRequestId === "string" ? body.checkoutRequestId : undefined;

    if (!checkoutRequestId) {
      return jsonResponse({ status: "error", message: "checkoutRequestId is required" }, { status: 400 });
    }

    const response = await fetch("https://swiftpay-backend-uvv9.onrender.com/api/mpesa-verification-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkoutId: checkoutRequestId,
      }),
    });

    const responseText = await response.text();
    const responseData = parseJsonSafely(responseText);

    if (!response.ok || !responseData) {
      return jsonResponse(
        { success: false, status: "failed" as PaymentStatus, message: "Failed to verify payment status." },
        { status: 502 },
      );
    }

    const rawStatus = String(responseData?.payment?.status ?? "").toLowerCase();
    const resultDesc =
      responseData?.payment?.resultDesc ??
      responseData?.payment?.message ??
      responseData?.message ??
      "";
    const receiptNumber =
      responseData?.payment?.mpesaReceiptNumber ??
      responseData?.payment?.receipt_number ??
      null;

    let status: PaymentStatus = "pending";

    if (["completed", "success", "paid", "succeeded"].includes(rawStatus)) {
      status = "success";
    } else if (["failed", "cancelled", "rejected"].includes(rawStatus)) {
      status = "failed";
    } else if (["processing", "pending", ""].includes(rawStatus)) {
      status = "pending";
    }

    return jsonResponse({
      success: responseData?.success !== false,
      status,
      state: status,
      rawStatus,
      resultDesc,
      receiptNumber,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to verify payment status.";
    return jsonResponse({ success: false, status: "failed", message }, { status: 500 });
  }
});
