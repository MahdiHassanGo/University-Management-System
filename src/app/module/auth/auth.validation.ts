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

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: "Refresh token is required in cookies",
    }),
  }),
});

const googleLoginValidationSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, "Google ID token is required"),
    programId: z.string().uuid("Invalid program ID").optional(),
    admissionSemesterId: z.string().uuid("Invalid admission semester ID").optional(),
  }),
});

export const AuthValidation = {
  registerStudentValidationSchema,
  loginUserValidationSchema,
  refreshTokenValidationSchema,
  googleLoginValidationSchema,
};
