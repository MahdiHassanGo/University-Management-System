import { z } from "zod";

const createProgramValidationSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Program code is required"),
    name: z.string().min(1, "Program name is required"),
    departmentId: z.string().uuid("Invalid department ID"),
    degreeType: z.string().min(1, "Degree type is required"),
    totalCredits: z.number().int().positive("Total credits must be positive"),
    maxSemesterCredits: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateProgramValidationSchema = z.object({
  body: z.object({
    code: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    departmentId: z.string().uuid().optional(),
    degreeType: z.string().min(1).optional(),
    totalCredits: z.number().int().positive().optional(),
    maxSemesterCredits: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const ProgramValidation = {
  createProgramValidationSchema,
  updateProgramValidationSchema,
};
