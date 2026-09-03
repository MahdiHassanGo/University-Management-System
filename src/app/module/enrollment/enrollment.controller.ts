import type { EnrollmentStatus } from "@prisma/client";
import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { EnrollmentService } from "./enrollment.service.js";

const enrollCourse = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await EnrollmentService.enrollCourseInDB(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course enrolled successfully",
    data: result,
  });
});

const dropCourse = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const enrollmentId = req.params.enrollmentId as string;

  const result = await EnrollmentService.dropCourseInDB(userId, role, enrollmentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course dropped successfully",
    data: result,
  });
});

const getMyEnrollments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await EnrollmentService.getMyEnrollmentsFromDB(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enrollments retrieved successfully",
    data: result,
  });
});

const getAllEnrollments = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    studentId: req.query.studentId as string,
    sectionId: req.query.sectionId as string,
    status: req.query.status as EnrollmentStatus,
    semesterId: req.query.semesterId as string,
  };

  const options = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await EnrollmentService.getAllEnrollmentsFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enrollments retrieved successfully",
    data: result,
  });
});

export const EnrollmentController = {
  enrollCourse,
  dropCourse,
  getMyEnrollments,
  getAllEnrollments,
};
