import { z } from "zod";

const initiatePaymentValidationSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid("Invalid invoice ID"),
    frontendUrl: z.string().url().optional(),
  }),
});

export const PaymentValidation = {
  initiatePaymentValidationSchema,
};
