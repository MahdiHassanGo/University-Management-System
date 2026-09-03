export interface ICreateProgramPayload {
  code: string;
  name: string;
  departmentId: string;
  degreeType: string;
  totalCredits: number;
  maxSemesterCredits?: number;
  isActive?: boolean;
}

export interface IUpdateProgramPayload {
  code?: string;
  name?: string;
  departmentId?: string;
  degreeType?: string;
  totalCredits?: number;
  maxSemesterCredits?: number;
  isActive?: boolean;
}

export interface IProgramFilterOptions {
  searchTerm?: string;
  departmentId?: string;
  isActive?: boolean;
}
