import config from "../config/index.js";
import AppError from "../utils/AppError.js";

export interface IBkashGrantTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  statusMessage?: string;
  statusCode?: string;
}

export interface IBkashCreatePaymentResponse {
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  paymentCreateTime: string;
  transactionStatus: string;
  statusCode: string;
  statusMessage: string;
}

export interface IBkashExecutePaymentResponse {
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  statusCode: string;
  statusMessage: string;
}

const getBkashBaseUrl = () => {
  return config.BKASH_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
};

const safeParseResponse = async <T>(res: Response, endpointName: string): Promise<T> => {
  const rawText = await res.text();
  const text = rawText.trim().replace(/^\uFEFF/, "");

  try {
    return JSON.parse(text) as T;
  } catch (_e) {
    try {
      // Escape raw control characters inside JSON string literals
      // biome-ignore lint/suspicious/noControlCharactersInRegex: sanitize control characters from external gateway HTTP responses
      const sanitized = text.replace(/[\x00-\x1F\x7F]/g, (match) => {
        if (match === "\n") return "\\n";
        if (match === "\r") return "\\r";
        if (match === "\t") return "\\t";
        return "";
      });
      return JSON.parse(sanitized) as T;
    } catch (_e2) {
      try {
        // Strip control characters completely if escaping fails
        // biome-ignore lint/suspicious/noControlCharactersInRegex: fallback strip control characters
        const stripped = text.replace(/[\x00-\x1F\x7F]/g, " ");
        return JSON.parse(stripped) as T;
      } catch (_e3) {
        const snippet = text.slice(0, 250).replace(/[\r\n\t]+/g, " ");
        throw new AppError(
          502,
          `bKash payment gateway (${endpointName}) returned invalid response (Status ${res.status}): ${snippet}`,
        );
      }
    }
  }
};

const grantToken = async (): Promise<string> => {
  const bkashUrl = getBkashBaseUrl();
  const appKey = config.BKASH_APP_KEY;
  const appSecret = config.BKASH_APP_SECRET;
  const username = config.BKASH_USERNAME;
  const password = config.BKASH_PASSWORD;

  if (!appKey || !appSecret || !username || !password || appKey.includes("placeholder")) {
    throw new AppError(
      500,
      "bKash gateway credentials (BKASH_APP_KEY, BKASH_APP_SECRET, etc.) are unconfigured or invalid.",
    );
  }

  const res = await fetch(`${bkashUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      username,
      password,
    },
    body: JSON.stringify({
      app_key: appKey,
      app_secret: appSecret,
    }),
  });

  const data = await safeParseResponse<IBkashGrantTokenResponse>(res, "grantToken");
  if (!data.id_token) {
    throw new AppError(
      400,
      `bKash payment gateway authentication failed (${data.statusCode || "9999"}): ${data.statusMessage || "Invalid or unrecognized credentials"}`,
    );
  }
  return data.id_token;
};

const createPayment = async (
  merchantInvoiceNumber: string,
  amount: number,
  payerReference: string,
): Promise<IBkashCreatePaymentResponse> => {
  const bkashUrl = getBkashBaseUrl();
  const appKey = config.BKASH_APP_KEY;
  const callbackUrl =
    config.BKASH_CALLBACK_URL ||
    "https://university-management-system-mu-sage.vercel.app/api/v1/payments/bkash/callback";

  if (!appKey || appKey.includes("placeholder")) {
    throw new AppError(500, "bKash payment gateway configuration is missing or unconfigured.");
  }

  const idToken = await grantToken();

  const res = await fetch(`${bkashUrl}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: idToken,
      "X-APP-Key": appKey,
    },
    body: JSON.stringify({
      mode: "0011",
      payerReference,
      callbackURL: callbackUrl,
      amount: amount.toFixed(2),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber,
    }),
  });

  const data = await safeParseResponse<IBkashCreatePaymentResponse>(res, "createPayment");
  return data;
};

const executePayment = async (paymentID: string): Promise<IBkashExecutePaymentResponse> => {
  const bkashUrl = getBkashBaseUrl();
  const appKey = config.BKASH_APP_KEY;

  if (!appKey || appKey.includes("placeholder")) {
    throw new AppError(500, "bKash payment gateway configuration is missing or unconfigured.");
  }

  const idToken = await grantToken();

  const res = await fetch(`${bkashUrl}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: idToken,
      "X-APP-Key": appKey,
    },
    body: JSON.stringify({
      paymentID,
    }),
  });

  const data = await safeParseResponse<IBkashExecutePaymentResponse>(res, "executePayment");
  return data;
};

export const BkashService = {
  createPayment,
  executePayment,
};
