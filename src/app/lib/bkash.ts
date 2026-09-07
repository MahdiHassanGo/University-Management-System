import config from "../config/index.js";
import AppError from "../utils/AppError.js";

export interface IBkashGrantTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
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

  const data = (await res.json()) as IBkashGrantTokenResponse;
  if (!data.id_token) {
    throw new AppError(500, "Failed to authenticate with bKash payment gateway");
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
    throw new AppError(
      500,
      "bKash payment gateway configuration is missing or unconfigured.",
    );
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

  const data = (await res.json()) as IBkashCreatePaymentResponse;
  return data;
};

const executePayment = async (paymentID: string): Promise<IBkashExecutePaymentResponse> => {
  const bkashUrl = getBkashBaseUrl();
  const appKey = config.BKASH_APP_KEY;

  if (!appKey || appKey.includes("placeholder")) {
    throw new AppError(
      500,
      "bKash payment gateway configuration is missing or unconfigured.",
    );
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

  const data = (await res.json()) as IBkashExecutePaymentResponse;
  return data;
};

export const BkashService = {
  createPayment,
  executePayment,
};
