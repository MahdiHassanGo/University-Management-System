import { z } from "zod";

const createFeeInvoiceValidationSchema = z.object({
  body: z.object({
    studentId: z.string().uuid("Invalid student ID"),
    semesterId: z.string().uuid("Invalid semester ID"),
    amount: z.number().positive("Amount must be positive"),
    dueDate: z.string().datetime("dueDate must be a valid ISO date string"),
  }),
});

const bulkCreateFeeInvoiceValidationSchema = z.object({
  body: z.object({
    semesterId: z.string().uuid("Invalid semester ID"),
    amount: z.number().positive("Amount must be positive"),
    dueDate: z.string().datetime("dueDate must be a valid ISO date string"),
  }),
});

export const FeeValidation = {
  createFeeInvoiceValidationSchema,
  bulkCreateFeeInvoiceValidationSchema,
};
