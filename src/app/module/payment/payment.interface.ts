export interface IInitiatePaymentPayload {
  invoiceId: string;
}

export interface IBkashCallbackQueryParams {
  paymentID?: string;
  status?: string;
  apiVersion?: string;
}
