import { z } from "zod";

const isValidDateString = (val: string) => !Number.isNaN(Date.parse(val));

const dateSchema = (fieldName: string) =>
  z.string().refine(isValidDateString, {
    message: `${fieldName} must be a valid date string (e.g. YYYY-MM-DD or ISO 8601)`,
  });

const money = z.number().finite().positive("Amount must be positive").refine(
  (amount) => Math.abs(amount * 100 - Math.round(amount * 100)) < 0.00001,
  "Amount must use at most two decimal places",
);

const createFeeInvoiceValidationSchema = z.object({
  body: z.object({
    studentId: z.string().uuid("Invalid student ID"),
    semesterId: z.string().uuid("Invalid semester ID"),
    amount: money,
    dueDate: dateSchema("dueDate"),
  }),
});

const bulkCreateFeeInvoiceValidationSchema = z.object({
  body: z.object({
    semesterId: z.string().uuid("Invalid semester ID"),
    amount: money,
    dueDate: dateSchema("dueDate"),
  }),
});

export const FeeValidation = {
  createFeeInvoiceValidationSchema,
  bulkCreateFeeInvoiceValidationSchema,
};
