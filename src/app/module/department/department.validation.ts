import { z } from "zod";

const createDepartmentValidationSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Department code is required"),
    name: z.string().min(1, "Department name is required"),
    isActive: z.boolean().optional(),
  }),
});

const updateDepartmentValidationSchema = z.object({
  body: z.object({
    code: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const DepartmentValidation = {
  createDepartmentValidationSchema,
  updateDepartmentValidationSchema,
};
