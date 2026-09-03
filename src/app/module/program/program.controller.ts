import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { ProgramService } from "./program.service.js";

const createProgram = catchAsync(async (req: Request, res: Response) => {
  const result = await ProgramService.createProgramInDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Program created successfully",
    data: result,
  });
});

const getAllPrograms = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    searchTerm: req.query.searchTerm as string,
    departmentId: req.query.departmentId as string,
    isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
  };

  const options = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await ProgramService.getAllProgramsFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Programs retrieved successfully",
    data: result,
  });
});

const getProgramById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ProgramService.getProgramByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Program retrieved successfully",
    data: result,
  });
});

const updateProgram = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ProgramService.updateProgramInDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Program updated successfully",
    data: result,
  });
});

const deleteProgram = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ProgramService.deleteProgramFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Program deleted successfully",
    data: result,
  });
});

export const ProgramController = {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
};
