import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { ResultService } from "./result.service.js";

const calculateSectionResults = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const sectionId = req.params.sectionId as string;

  const result = await ResultService.calculateSectionResultsInDB(userId, role, sectionId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Section results calculated successfully",
    data: result,
  });
});

const publishSectionResults = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const sectionId = req.params.sectionId as string;

  const result = await ResultService.publishSectionResultsInDB(userId, role, sectionId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Section results published successfully",
    data: result,
  });
});

const getMyPublishedResults = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;

  const result = await ResultService.getMyPublishedResultsFromDB(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Published course results retrieved successfully",
    data: result,
  });
});

export const ResultController = {
  calculateSectionResults,
  publishSectionResults,
  getMyPublishedResults,
};
