import { z } from "zod";

const academicStatusEnum = z.enum(["ACTIVE", "SUSPENDED", "GRADUATED", "INACTIVE"]);

const createInstructorValidationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    name: z.string().min(1, "Name is required"),
    designation: z.string().min(1, "Designation is required"),
    departmentId: z.string().uuid("Invalid department ID"),
    contactNo: z.string().optional(),
  }),
});

const updateInstructorValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    designation: z.string().optional(),
    departmentId: z.string().uuid().optional(),
    contactNo: z.string().optional(),
    academicStatus: academicStatusEnum.optional(),
  }),
});

export const InstructorValidation = {
  createInstructorValidationSchema,
  updateInstructorValidationSchema,
};
