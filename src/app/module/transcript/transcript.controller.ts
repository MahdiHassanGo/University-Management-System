import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { TranscriptService } from "./transcript.service.js";

const getMyTranscript = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await TranscriptService.getStudentTranscriptFromDB(userId, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Academic transcript retrieved successfully",
    data: result,
  });
});

const getStudentTranscript = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.params.studentId as string;
  const result = await TranscriptService.getStudentTranscriptFromDB(studentId, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student academic transcript retrieved successfully",
    data: result,
  });
});

export const TranscriptController = {
  getMyTranscript,
  getStudentTranscript,
};
