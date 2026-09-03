import { z } from "zod";

const examStatusEnum = z.enum(["DRAFT", "PUBLISHED", "COMPLETED"]);

const createExamValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    totalMarks: z.number().positive("totalMarks must be positive"),
    weightPercentage: z
      .number()
      .positive("weightPercentage must be positive")
      .max(100, "weightPercentage cannot exceed 100"),
    heldAt: z.string().datetime().optional(),
    status: examStatusEnum.optional(),
  }),
});

const updateExamValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    totalMarks: z.number().positive().optional(),
    weightPercentage: z.number().positive().max(100).optional(),
    heldAt: z.string().datetime().optional(),
    status: examStatusEnum.optional(),
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
