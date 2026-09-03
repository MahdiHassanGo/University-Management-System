import type { SemesterStatus, SemesterTerm } from "@prisma/client";
import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { SemesterService } from "./semester.service.js";

const createSemester = catchAsync(async (req: Request, res: Response) => {
  const result = await SemesterService.createSemesterInDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Academic semester created successfully",
    data: result,
  });
});

const getAllSemesters = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    year: req.query.year ? Number(req.query.year) : undefined,
    term: req.query.term as SemesterTerm,
    status: req.query.status as SemesterStatus,
  };

  const options = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await SemesterService.getAllSemestersFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Academic semesters retrieved successfully",
    data: result,
  });
});

const getSemesterById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await SemesterService.getSemesterByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Academic semester retrieved successfully",
    data: result,
  });
});

const updateSemester = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await SemesterService.updateSemesterInDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Academic semester updated successfully",
    data: result,
  });
});

const updateSemesterStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  const result = await SemesterService.updateSemesterStatusInDB(id, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Academic semester status updated successfully",
    data: result,
  });
});

export const SemesterController = {
  createSemester,
  getAllSemesters,
  getSemesterById,
  updateSemester,
  updateSemesterStatus,
};
