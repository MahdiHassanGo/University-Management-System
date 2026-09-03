import type { AcademicStatus } from "@prisma/client";
import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { StudentService } from "./student.service.js";

const createStudent = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.createStudentInDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Student created successfully",
    data: result,
  });
});

const getAllStudents = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    searchTerm: req.query.searchTerm as string,
    programId: req.query.programId as string,
    academicStatus: req.query.academicStatus as AcademicStatus,
  };

  const options = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await StudentService.getAllStudentsFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Students retrieved successfully",
    data: result,
  });
});

const getStudentById = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.params.studentId as string;
  const result = await StudentService.getStudentByIdFromDB(studentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student profile retrieved successfully",
    data: result,
  });
});

const getMyStudentProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await StudentService.getMyStudentProfileFromDB(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student profile retrieved successfully",
    data: result,
  });
});

const updateMyStudentProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await StudentService.updateMyStudentProfileInDB(userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student profile updated successfully",
    data: result,
  });
});

const updateStudent = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.params.studentId as string;
  const result = await StudentService.updateStudentInDB(studentId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student profile updated successfully",
    data: result,
  });
});

export const StudentController = {
  createStudent,
  getAllStudents,
  getStudentById,
  getMyStudentProfile,
  updateMyStudentProfile,
  updateStudent,
};
