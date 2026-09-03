import type { AcademicStatus, Gender } from "@prisma/client";

export interface ICreateStudentPayload {
  email: string;
  password: string;
  name: string;
  programId: string;
  admissionSemesterId: string;
  gender?: Gender;
  contactNo?: string;
  emergencyContactNo?: string;
  address?: string;
  bloodGroup?: string;
}

export interface IUpdateStudentPayload {
  name?: string;
  gender?: Gender;
  contactNo?: string;
  emergencyContactNo?: string;
  address?: string;
  bloodGroup?: string;
  programId?: string;
  admissionSemesterId?: string;
  academicStatus?: AcademicStatus;
}

export interface IStudentFilterOptions {
  searchTerm?: string;
  programId?: string;
  academicStatus?: AcademicStatus;
}
