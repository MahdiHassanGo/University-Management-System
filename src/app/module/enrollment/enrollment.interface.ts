import type { EnrollmentStatus } from "@prisma/client";

export interface ICreateEnrollmentPayload {
  sectionId: string;
}

export interface IEnrollmentFilterOptions {
  studentId?: string;
  sectionId?: string;
  status?: EnrollmentStatus;
  semesterId?: string;
}
