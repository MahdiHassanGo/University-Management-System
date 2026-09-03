export interface ICreateCoursePayload {
  code: string;
  title: string;
  credit: number;
  courseLevel?: number;
  departmentId: string;
  isActive?: boolean;
}

export interface IUpdateCoursePayload {
  code?: string;
  title?: string;
  credit?: number;
  courseLevel?: number;
  departmentId?: string;
  isActive?: boolean;
}

export interface ICourseFilterOptions {
  searchTerm?: string;
  departmentId?: string;
  isActive?: boolean;
}

export interface IAddProgramCoursePayload {
  courseId: string;
  recommendedSemester: number;
  isOptional?: boolean;
}

export interface IAddPrerequisitePayload {
  prerequisiteId: string;
  minGradePoint?: number;
}
