import type { SectionStatus } from "@prisma/client";
import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { SectionService } from "./section.service.js";

const createSection = catchAsync(async (req: Request, res: Response) => {
  const result = await SectionService.createSectionInDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Section created successfully",
    data: result,
  });
});

const getAllSections = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    courseId: req.query.courseId as string,
    semesterId: req.query.semesterId as string,
    instructorId: req.query.instructorId as string,
    status: req.query.status as SectionStatus,
    searchTerm: req.query.searchTerm as string,
  };

  const options = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await SectionService.getAllSectionsFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Sections retrieved successfully",
    data: result,
  });
});

const getAvailableSectionsForStudent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;

  const options = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await SectionService.getAvailableSectionsForStudentFromDB(userId, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Available sections retrieved successfully",
    data: result,
  });
});

const getSectionById = catchAsync(async (req: Request, res: Response) => {
  const sectionId = req.params.sectionId as string;
  const result = await SectionService.getSectionByIdFromDB(sectionId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Section retrieved successfully",
    data: result,
  });
});

const getSectionStudents = catchAsync(async (req: Request, res: Response) => {
  const sectionId = req.params.sectionId as string;
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;

  const result = await SectionService.getSectionStudentsFromDB(sectionId, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enrolled students retrieved successfully",
    data: result,
  });
});

const updateSection = catchAsync(async (req: Request, res: Response) => {
  const sectionId = req.params.sectionId as string;
  const result = await SectionService.updateSectionInDB(sectionId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Section updated successfully",
    data: result,
  });
});

const deleteSection = catchAsync(async (req: Request, res: Response) => {
  const sectionId = req.params.sectionId as string;
  await SectionService.deleteSectionFromDB(sectionId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Section deleted successfully",
    data: null,
  });
});

export const SectionController = {
  createSection,
  getAllSections,
  getAvailableSectionsForStudent,
  getSectionById,
  getSectionStudents,
  updateSection,
  deleteSection,
};
