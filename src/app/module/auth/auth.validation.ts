import { z } from "zod";

const registerStudentValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    programId: z.string().uuid("Invalid program ID"),
    admissionSemesterId: z.string().uuid("Invalid admission semester ID"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    contactNo: z.string().optional(),
  }),
});

const loginUserValidationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const AuthValidation = {
  registerStudentValidationSchema,
  loginUserValidationSchema,
};
