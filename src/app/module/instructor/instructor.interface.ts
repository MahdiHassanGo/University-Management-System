import type { AcademicStatus } from "@prisma/client";

export interface ICreateInstructorPayload {
  email: string;
  password: string;
  name: string;
  designation: string;
  departmentId: string;
  contactNo?: string;
}

export interface IUpdateInstructorPayload {
  name?: string;
  designation?: string;
  departmentId?: string;
  contactNo?: string;
  academicStatus?: AcademicStatus;
}

export interface IInstructorFilterOptions {
  searchTerm?: string;
  departmentId?: string;
  academicStatus?: AcademicStatus;
}
