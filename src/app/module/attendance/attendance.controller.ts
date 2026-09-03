import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { AttendanceService } from "./attendance.service.js";

const createAttendanceSession = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const sectionId = req.params.sectionId as string;

  const result = await AttendanceService.createAttendanceSessionInDB(
    userId,
    role,
    sectionId,
    req.body,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Attendance session created successfully",
    data: result,
  });
});

const bulkMarkAttendance = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const sessionId = req.params.sessionId as string;

  const result = await AttendanceService.bulkMarkAttendanceInDB(userId, role, sessionId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance records saved successfully",
    data: result,
  });
});

const updateAttendanceRecord = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const recordId = req.params.recordId as string;

  const result = await AttendanceService.updateAttendanceRecordInDB(
    userId,
    role,
    recordId,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance record updated successfully",
    data: result,
  });
});

const getSectionAttendance = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const sectionId = req.params.sectionId as string;

  const result = await AttendanceService.getSectionAttendanceFromDB(userId, role, sectionId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Section attendance retrieved successfully",
    data: result,
  });
});

const getMyAttendance = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;

  const result = await AttendanceService.getMyAttendanceFromDB(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance summary retrieved successfully",
    data: result,
  });
});

export const AttendanceController = {
  createAttendanceSession,
  bulkMarkAttendance,
  updateAttendanceRecord,
  getSectionAttendance,
  getMyAttendance,
};
