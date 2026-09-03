export interface ICreateDepartmentPayload {
  code: string;
  name: string;
  isActive?: boolean;
}

export interface IUpdateDepartmentPayload {
  code?: string;
  name?: string;
  isActive?: boolean;
}

export interface IDepartmentFilterOptions {
  searchTerm?: string;
  isActive?: boolean;
}
