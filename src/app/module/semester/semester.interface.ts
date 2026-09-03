import type { SemesterStatus, SemesterTerm } from "@prisma/client";

export interface ICreateSemesterPayload {
  year: number;
  term: SemesterTerm;
  status?: SemesterStatus;
  registrationStart: string | Date;
  registrationEnd: string | Date;
  classStart: string | Date;
  classEnd: string | Date;
  resultDate?: string | Date;
}

export interface IUpdateSemesterPayload {
  year?: number;
  term?: SemesterTerm;
  status?: SemesterStatus;
  registrationStart?: string | Date;
  registrationEnd?: string | Date;
  classStart?: string | Date;
  classEnd?: string | Date;
  resultDate?: string | Date;
}

export interface ISemesterFilterOptions {
  year?: number;
  term?: SemesterTerm;
  status?: SemesterStatus;
}
