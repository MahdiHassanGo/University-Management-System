import { z } from "zod";

const isValidDateString = (val: string) => !Number.isNaN(Date.parse(val));

const dateSchema = (fieldName: string) =>
  z.string().refine(isValidDateString, {
    message: `${fieldName} must be a valid date string (e.g. YYYY-MM-DD or ISO 8601)`,
  });

const createFeeInvoiceValidationSchema = z.object({
  body: z.object({
    studentId: z.string().uuid("Invalid student ID"),
    semesterId: z.string().uuid("Invalid semester ID"),
    amount: z.number().positive("Amount must be positive"),
    dueDate: dateSchema("dueDate"),
  }),
});

const bulkCreateFeeInvoiceValidationSchema = z.object({
  body: z.object({
    semesterId: z.string().uuid("Invalid semester ID"),
    amount: z.number().positive("Amount must be positive"),
    dueDate: dateSchema("dueDate"),
  }),
});

export const FeeValidation = {
  createFeeInvoiceValidationSchema,
  bulkCreateFeeInvoiceValidationSchema,
};
