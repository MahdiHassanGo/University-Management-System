import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { CourseService } from "./course.service.js";

const createCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.createCourseInDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course created successfully",
    data: result,
  });
});

const getAllCourses = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    searchTerm: req.query.searchTerm as string,
    departmentId: req.query.departmentId as string,
    isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
  };

  const options = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await CourseService.getAllCoursesFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Courses retrieved successfully",
    data: result,
  });
});

const getCourseById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await CourseService.getCourseByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course retrieved successfully",
    data: result,
  });
});

const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await CourseService.updateCourseInDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course updated successfully",
    data: result,
  });
});

const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await CourseService.deleteCourseFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course deleted successfully",
    data: result,
  });
});

// Curriculum Management
const addCourseToProgramCurriculum = catchAsync(async (req: Request, res: Response) => {
  const programId = req.params.programId as string;
  const result = await CourseService.addCourseToProgramCurriculum(programId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course added to program curriculum successfully",
    data: result,
  });
});

const removeCourseFromProgramCurriculum = catchAsync(async (req: Request, res: Response) => {
  const programId = req.params.programId as string;
  const courseId = req.params.courseId as string;
  await CourseService.removeCourseFromProgramCurriculum(programId, courseId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course removed from program curriculum successfully",
    data: null,
  });
});

// Prerequisite Management
const addPrerequisiteToCourse = catchAsync(async (req: Request, res: Response) => {
  const courseId = req.params.courseId as string;
  const result = await CourseService.addPrerequisiteToCourse(courseId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Prerequisite added to course successfully",
    data: result,
  });
});

const removePrerequisiteFromCourse = catchAsync(async (req: Request, res: Response) => {
  const courseId = req.params.courseId as string;
  const prerequisiteId = req.params.prerequisiteId as string;
  await CourseService.removePrerequisiteFromCourse(courseId, prerequisiteId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Prerequisite removed from course successfully",
    data: null,
  });
});

const getCoursePrerequisites = catchAsync(async (req: Request, res: Response) => {
  const courseId = req.params.courseId as string;
  const result = await CourseService.getCoursePrerequisitesFromDB(courseId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course prerequisites retrieved successfully",
    data: result,
  });
});

export const CourseController = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addCourseToProgramCurriculum,
  removeCourseFromProgramCurriculum,
  addPrerequisiteToCourse,
  removePrerequisiteFromCourse,
  getCoursePrerequisites,
};
