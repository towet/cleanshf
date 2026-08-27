const corsHeaders: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-allow-methods": "POST, OPTIONS",
};

type PaymentStatus = "pending" | "success" | "failed" | "timeout";

function parseJsonSafely(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseBody(req: { body?: unknown }): Record<string, unknown> {
  const raw = req.body;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
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

  try {
    const body = parseBody(req);
    const checkoutRequestId =
      typeof body.checkoutRequestId === "string" ? body.checkoutRequestId : undefined;

    if (!checkoutRequestId) {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(400).json({ status: "error", message: "checkoutRequestId is required" });
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

    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

    if (!response.ok || !responseData) {
      return res.status(502).json({
        success: false,
        status: "failed" as PaymentStatus,
        message: "Failed to verify payment status.",
      });
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

    return res.status(200).json({
      success: responseData?.success !== false,
      status,
      state: status,
      rawStatus,
      resultDesc,
      receiptNumber,
    });
  } catch (err) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    const message = err instanceof Error ? err.message : "Failed to verify payment status.";
    return res.status(500).json({ success: false, status: "failed", message });
  }
}
