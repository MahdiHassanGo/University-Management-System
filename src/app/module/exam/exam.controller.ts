import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { ExamService } from "./exam.service.js";

const createExam = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const sectionId = req.params.sectionId as string;

  const result = await ExamService.createExamInDB(userId, role, sectionId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Exam created successfully",
    data: result,
  });
});

const getSectionExams = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const sectionId = req.params.sectionId as string;

  const result = await ExamService.getSectionExamsFromDB(userId, role, sectionId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Section exams retrieved successfully",
    data: result,
  });
});

const updateExam = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const examId = req.params.examId as string;

  const result = await ExamService.updateExamInDB(userId, role, examId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Exam updated successfully",
    data: result,
  });
});

const deleteExam = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const examId = req.params.examId as string;

  await ExamService.deleteExamFromDB(userId, role, examId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Exam deleted successfully",
    data: null,
  });
});

const bulkMarkExamResults = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const examId = req.params.examId as string;

  const result = await ExamService.bulkMarkExamResultsInDB(userId, role, examId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Exam marks saved successfully",
    data: result,
  });
});

const getExamResults = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const examId = req.params.examId as string;

  const result = await ExamService.getExamResultsFromDB(userId, role, examId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Exam results retrieved successfully",
    data: result,
  });
});

export const ExamController = {
  createExam,
  getSectionExams,
  updateExam,
  deleteExam,
  bulkMarkExamResults,
  getExamResults,
};
