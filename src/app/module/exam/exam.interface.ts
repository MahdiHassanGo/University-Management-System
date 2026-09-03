import type { ExamStatus } from "@prisma/client";

export interface ICreateExamPayload {
  title: string;
  totalMarks: number;
  weightPercentage: number;
  heldAt?: string | Date;
  status?: ExamStatus;
}

export interface IUpdateExamPayload {
  title?: string;
  totalMarks?: number;
  weightPercentage?: number;
  heldAt?: string | Date;
  status?: ExamStatus;
}

export interface IExamMarksItem {
  studentId: string;
  marks: number;
}

export interface IBulkExamMarksPayload {
  results: IExamMarksItem[];
}
