import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { DepartmentService } from "./department.service.js";

const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.createDepartmentInDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Department created successfully",
    data: result,
  });
});

const getAllDepartments = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    searchTerm: req.query.searchTerm as string,
    isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
  };

  const options = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await DepartmentService.getAllDepartmentsFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Departments retrieved successfully",
    data: result,
  });
});

const getDepartmentById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await DepartmentService.getDepartmentByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Department retrieved successfully",
    data: result,
  });
});

const updateDepartment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await DepartmentService.updateDepartmentInDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Department updated successfully",
    data: result,
  });
});

const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await DepartmentService.deleteDepartmentFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Department deleted successfully",
    data: result,
  });
});

export const DepartmentController = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
