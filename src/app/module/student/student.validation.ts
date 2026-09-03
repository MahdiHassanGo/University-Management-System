import { z } from "zod";

const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
const academicStatusEnum = z.enum(["ACTIVE", "SUSPENDED", "GRADUATED", "INACTIVE"]);

const createStudentValidationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    name: z.string().min(1, "Name is required"),
    programId: z.string().uuid("Invalid program ID"),
    admissionSemesterId: z.string().uuid("Invalid admission semester ID"),
    gender: genderEnum.optional(),
    contactNo: z.string().optional(),
    emergencyContactNo: z.string().optional(),
    address: z.string().optional(),
    bloodGroup: z.string().optional(),
  }),
});

const updateStudentValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    gender: genderEnum.optional(),
    contactNo: z.string().optional(),
    emergencyContactNo: z.string().optional(),
    address: z.string().optional(),
    bloodGroup: z.string().optional(),
    programId: z.string().uuid().optional(),
    admissionSemesterId: z.string().uuid().optional(),
    academicStatus: academicStatusEnum.optional(),
  }),
});

export const StudentValidation = {
  createStudentValidationSchema,
  updateStudentValidationSchema,
};
