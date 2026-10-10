export interface IInitiatePaymentPayload {
  invoiceId: string;
  frontendUrl?: string;
}

export interface IBkashCallbackQueryParams {
  paymentID?: string;
  status?: string;
  apiVersion?: string;
}
