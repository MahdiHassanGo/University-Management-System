import { z } from "zod";

const examStatusEnum = z.enum(["DRAFT", "PUBLISHED", "COMPLETED"]);

const isValidDateString = (val: string) => !Number.isNaN(Date.parse(val));

const optionalDateSchema = (fieldName: string) =>
  z
    .string()
    .refine(isValidDateString, {
      message: `${fieldName} must be a valid date string (e.g. YYYY-MM-DD or ISO 8601)`,
    })
    .optional();

const createExamValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    totalMarks: z.number().positive("totalMarks must be positive"),
    weightPercentage: z
      .number()
      .positive("weightPercentage must be positive")
      .max(100, "weightPercentage cannot exceed 100"),
    heldAt: optionalDateSchema("heldAt"),
    status: examStatusEnum.optional(),
  }),
});

const updateExamValidationSchema = z.object({
  body: z
    .object({
      title: z.string().min(1).optional(),
      totalMarks: z.number().positive().optional(),
      weightPercentage: z.number().positive().max(100).optional(),
      heldAt: optionalDateSchema("heldAt"),
      status: examStatusEnum.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

const bulkExamMarksValidationSchema = z.object({
  body: z.object({
    results: z
      .array(
        z.object({
          studentId: z.string().uuid("Invalid student ID"),
          marks: z.number().min(0, "Marks cannot be negative"),
        }),
      )
      .min(1, "At least one mark entry is required"),
  }),
});

export const ExamValidation = {
  createExamValidationSchema,
  updateExamValidationSchema,
  bulkExamMarksValidationSchema,
};
