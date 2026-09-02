export type IGenericErrorMessage = {
  path: string | number;
  message: string;
};

export type IGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorSources: IGenericErrorMessage[];
};

export type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type IPaginatedResult<T> = {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  items: T[];
};
