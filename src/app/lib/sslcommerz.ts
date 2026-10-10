import config from "../config/index.js";
import AppError from "../utils/AppError.js";

const BASE = "https://sandbox.sslcommerz.com";
export interface SslValidation {
  status: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  currency?: string;
  bank_tran_id?: string;
  risk_level?: string;
}
interface SslSession {
  status: string;
  sessionkey?: string;
  GatewayPageURL?: string;
}
export function getSslConfig() {
  const { SSLCOMMERZ_STORE_ID: storeId, SSLCOMMERZ_STORE_PASS: storePass,
    BACKEND_URL: backendUrl, FRONTEND_URL: frontendUrl } = config;
  if (!storeId || !storePass || !backendUrl || !frontendUrl) {
    throw new AppError(503, "Payment checkout is unavailable. Please contact the finance office.");
  }
  return { storeId, storePass, backendUrl: backendUrl.replace(/\/$/, ""), frontendUrl };
}
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Gateway HTTP error");
    return await response.json() as T;
  } catch {
    // Never expose merchant passwords, validation URLs, or raw gateway responses.
    throw new AppError(502, "The payment provider could not be reached. Please check your payment history before retrying.");
  }
}
export const SslCommerzService = {
  async createSession(input: { transactionId: string; amount: number; name: string; email: string; phone?: string }) {
    const { storeId, storePass, backendUrl } = getSslConfig();
    const callback = `${backendUrl}/api/v1/payments/sslcommerz`;
    const params = new URLSearchParams({
      store_id: storeId, store_passwd: storePass, total_amount: input.amount.toFixed(2),
      currency: "BDT", tran_id: input.transactionId,
      success_url: `${callback}/callback/success`, fail_url: `${callback}/callback/fail`,
      cancel_url: `${callback}/callback/cancel`, ipn_url: `${callback}/ipn`,
      shipping_method: "NO", product_name: "University tuition fee", product_category: "Education",
      product_profile: "non-physical-goods", cus_name: input.name, cus_email: input.email,
      cus_phone: input.phone || "", cus_add1: "University campus", cus_city: "Dhaka", cus_country: "Bangladesh",
    });
    const result = await request<SslSession>(`${BASE}/gwprocess/v4/api.php`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString(),
    });
    if (result.status !== "SUCCESS" || !result.GatewayPageURL || !result.sessionkey) {
      throw new AppError(502, "The payment provider could not start checkout. Please try again later.");
    }
    const gateway = new URL(result.GatewayPageURL);
    if (gateway.protocol !== "https:" || !(gateway.hostname === "sslcommerz.com" || gateway.hostname.endsWith(".sslcommerz.com"))) {
      throw new AppError(502, "The payment provider returned an invalid checkout address.");
    }
    return { gatewayUrl: gateway.toString(), sessionKey: result.sessionkey };
  },
  async validate(valId: string) {
    const { storeId, storePass } = getSslConfig();
    const params = new URLSearchParams({ val_id: valId, store_id: storeId, store_passwd: storePass, format: "json" });
    return request<SslValidation>(`${BASE}/validator/api/validationserverAPI.php?${params}`);
  },
  async querySession(sessionKey: string) {
    const { storeId, storePass } = getSslConfig();
    const params = new URLSearchParams({ sessionkey: sessionKey, store_id: storeId, store_passwd: storePass, format: "json" });
    return request<SslValidation>(`${BASE}/validator/api/merchantTransIDvalidationAPI.php?${params}`);
  },
};
