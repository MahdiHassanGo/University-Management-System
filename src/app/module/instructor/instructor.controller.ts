import type { AcademicStatus } from "@prisma/client";
import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { InstructorService } from "./instructor.service.js";

const createInstructor = catchAsync(async (req: Request, res: Response) => {
  const result = await InstructorService.createInstructorInDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Instructor created successfully",
    data: result,
  });
});

const getAllInstructors = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    searchTerm: req.query.searchTerm as string,
    departmentId: req.query.departmentId as string,
    academicStatus: req.query.academicStatus as AcademicStatus,
  };

  const options = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await InstructorService.getAllInstructorsFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Instructors retrieved successfully",
    data: result,
  });
});

const getInstructorById = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.params.instructorId as string;
  const result = await InstructorService.getInstructorByIdFromDB(instructorId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Instructor profile retrieved successfully",
    data: result,
  });
});

const getMyInstructorProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await InstructorService.getMyInstructorProfileFromDB(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Instructor profile retrieved successfully",
    data: result,
  });
});

const updateMyInstructorProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await InstructorService.updateMyInstructorProfileInDB(userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Instructor profile updated successfully",
    data: result,
  });
});

const updateInstructor = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.params.instructorId as string;
  const result = await InstructorService.updateInstructorInDB(instructorId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Instructor profile updated successfully",
    data: result,
  });
});

export const InstructorController = {
  createInstructor,
  getAllInstructors,
  getInstructorById,
  getMyInstructorProfile,
  updateMyInstructorProfile,
  updateInstructor,
};
