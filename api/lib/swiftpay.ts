declare const process: {
  env: Record<string, string | undefined>;
};

export const SWIFTPAY_DEFAULTS = {
  apiKey: "sp_fb3266cf-164b-42a2-903c-c18fbc82b806",
  tillId: "7b98fd1c-3776-45d1-bf9b-94ac571344ac",
  baseUrl: "https://swiftpay-backend-uvv9.onrender.com",
};

export function normalizeBaseUrl(input: string): string {
  return input.trim().replace(/\/+$/g, "");
}

export function getSwiftpayConfig() {
  return {
    apiKey: process.env.SWIFTPAY_API_KEY ?? SWIFTPAY_DEFAULTS.apiKey,
    tillId: process.env.SWIFTPAY_TILL_ID ?? SWIFTPAY_DEFAULTS.tillId,
    baseUrl: SWIFTPAY_DEFAULTS.baseUrl,
  };
}

export function swiftpayApiUrl(baseUrl: string, path: string): string {
  const root = /\/api$/i.test(baseUrl) ? baseUrl : `${baseUrl}/api`;
  return `${root}${path.startsWith("/") ? path : `/${path}`}`;
}

export function safeJsonParse(text: string): unknown {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export function extractMessage(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const anyObj = obj as Record<string, unknown>;
  const msg =
    anyObj.message ??
    anyObj.Message ??
    anyObj.error ??
    anyObj.CustomerMessage ??
    anyObj.customerMessage;
  return typeof msg === "string" && msg.trim() !== "" ? msg : undefined;
}

export function extractCheckoutRequestId(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  const targetKeys = new Set<string>(["checkoutrequestid", "checkout_request_id", "checkout_id"]);

  const deepFind = (value: unknown, depth: number): string | undefined => {
    if (depth > 8) return undefined;

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = deepFind(item, depth + 1);
        if (found) return found;
      }
      return undefined;
    }

    if (!value || typeof value !== "object") return undefined;

    const rec = value as Record<string, unknown>;
    for (const [k, v] of Object.entries(rec)) {
      const key = k.toLowerCase();
      if (targetKeys.has(key)) {
        if (typeof v === "string" && v.trim() !== "") return v;
      }

      const nested = deepFind(v, depth + 1);
      if (nested) return nested;
    }

    return undefined;
  };

  const anyObj = obj as Record<string, unknown>;
  const direct =
    anyObj.checkoutRequestId ??
    anyObj.checkout_request_id ??
    anyObj.checkout_id ??
    anyObj.CheckoutRequestID ??
    anyObj.CheckoutRequestId;
  if (typeof direct === "string" && direct.trim() !== "") return direct;

  const data = anyObj.data;
  if (data && typeof data === "object") {
    const dataObj = data as Record<string, unknown>;
    const checkoutId =
      dataObj.checkout_id ?? dataObj.checkoutRequestId ?? dataObj.checkoutRequestID;
    if (typeof checkoutId === "string" && checkoutId.trim() !== "") return checkoutId;
  }

  return deepFind(obj, 0);
}

export function computePaymentState(upstream: unknown): "success" | "pending" | "failed" {
  if (!upstream || typeof upstream !== "object") return "pending";

  const anyObj = upstream as Record<string, unknown>;
  const payment = anyObj.payment;
  if (payment && typeof payment === "object") {
    const rawStatus = String((payment as Record<string, unknown>).status ?? "").toLowerCase();
    if (["completed", "success", "paid", "succeeded"].includes(rawStatus)) return "success";
    if (["failed", "cancelled", "canceled", "rejected"].includes(rawStatus)) return "failed";
    if (["processing", "pending", ""].includes(rawStatus)) return "pending";
  }

  const stateNumber = anyObj.state ?? anyObj.State;
  if (typeof stateNumber === "number") {
    if (stateNumber === 0) return "success";
    if (stateNumber > 0) return "failed";
  }
  if (typeof stateNumber === "string" && stateNumber.trim() !== "" && !Number.isNaN(Number(stateNumber))) {
    const n = Number(stateNumber);
    if (n === 0) return "success";
    if (n > 0) return "failed";
  }

  const rc = anyObj.ResultCode ?? anyObj.resultCode ?? anyObj.result_code;
  if (typeof rc === "number") {
    if (rc === 0) return "success";
    if (rc === 4999) return "pending";
    if (rc > 0) return "failed";
  }

  const status = anyObj.status ?? anyObj.Status;
  if (typeof status === "string") {
    const lowered = status.toLowerCase();
    if (lowered === "success" || lowered === "completed") return "success";
    if (lowered === "failed" || lowered === "error" || lowered === "cancelled" || lowered === "canceled") {
      return "failed";
    }
    if (lowered === "processing" || lowered === "pending") return "pending";
  }

  return "pending";
}
