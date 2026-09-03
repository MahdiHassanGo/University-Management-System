import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { ReportService } from "./report.service.js";

const getEnrollmentReport = catchAsync(async (req: Request, res: Response) => {
  const semesterId = req.query.semesterId as string;
  const result = await ReportService.getEnrollmentReportFromDB(semesterId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enrollment analytics report retrieved successfully",
    data: result,
  });
});

const getAttendanceReport = catchAsync(async (req: Request, res: Response) => {
  const sectionId = req.query.sectionId as string;
  const result = await ReportService.getAttendanceReportFromDB(sectionId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance analytics report retrieved successfully",
    data: result,
  });
});

const getResultReport = catchAsync(async (req: Request, res: Response) => {
  const semesterId = req.query.semesterId as string;
  const result = await ReportService.getResultReportFromDB(semesterId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Academic results performance report retrieved successfully",
    data: result,
  });
});

const getFinanceReport = catchAsync(async (req: Request, res: Response) => {
  const semesterId = req.query.semesterId as string;
  const result = await ReportService.getFinanceReportFromDB(semesterId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Financial summary report retrieved successfully",
    data: result,
  });
});

export const ReportController = {
  getEnrollmentReport,
  getAttendanceReport,
  getResultReport,
  getFinanceReport,
};
