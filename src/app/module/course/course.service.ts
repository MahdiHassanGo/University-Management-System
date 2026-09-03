import type { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import {
  calculatePagination,
  createPaginatedResponse,
  type IPaginationOptions,
} from "../../utils/pagination.js";
import type {
  IAddPrerequisitePayload,
  IAddProgramCoursePayload,
  ICourseFilterOptions,
  ICreateCoursePayload,
  IUpdateCoursePayload,
} from "./course.interface.js";

const createCourseInDB = async (payload: ICreateCoursePayload) => {
  const { code, departmentId } = payload;

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department?.isActive) {
    throw new AppError(404, "Department not found or inactive");
  }

  const existingCode = await prisma.course.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (existingCode) {
    throw new AppError(409, "Course code already exists");
  }

  const course = await prisma.course.create({
    data: {
      ...payload,
      code: code.toUpperCase(),
    },
    include: {
      department: true,
    },
  });

  return course;
};

const getAllCoursesFromDB = async (filters: ICourseFilterOptions, options: IPaginationOptions) => {
  const { searchTerm, departmentId, isActive } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const andConditions: Prisma.CourseWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { code: { contains: searchTerm, mode: "insensitive" } },
        { title: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (departmentId) {
    andConditions.push({ departmentId });
  }

  if (isActive !== undefined) {
    andConditions.push({ isActive });
  }

  const whereConditions: Prisma.CourseWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        department: true,
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
      },
    }),
    prisma.course.count({ where: whereConditions }),
  ]);

  return createPaginatedResponse(items, total, page, limit);
};

const getCourseByIdFromDB = async (id: string) => {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id }, { code: id.toUpperCase() }] },
    include: {
      department: true,
      prerequisites: {
        include: {
          prerequisite: true,
        },
      },
      prerequisiteFor: {
        include: {
          course: true,
        },
      },
      programCourses: {
        include: {
          program: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError(404, "Course not found");
  }

  return course;
};

const updateCourseInDB = async (id: string, payload: IUpdateCoursePayload) => {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id }, { code: id.toUpperCase() }] },
  });

  if (!course) {
    throw new AppError(404, "Course not found");
  }

  if (payload.code && payload.code.toUpperCase() !== course.code) {
    const existingCode = await prisma.course.findUnique({
      where: { code: payload.code.toUpperCase() },
    });
    if (existingCode) {
      throw new AppError(409, "Course code already exists");
    }
  }

  if (payload.departmentId && payload.departmentId !== course.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: payload.departmentId },
    });
    if (!department) {
      throw new AppError(404, "Department not found");
    }
  }

  const updatedCourse = await prisma.course.update({
    where: { id: course.id },
    data: {
      ...payload,
      ...(payload.code && { code: payload.code.toUpperCase() }),
    },
    include: {
      department: true,
    },
  });

  return updatedCourse;
};

const deleteCourseFromDB = async (id: string) => {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id }, { code: id.toUpperCase() }] },
    include: {
      _count: {
        select: {
          sections: true,
          programCourses: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError(404, "Course not found");
  }

  if (course._count.sections > 0 || course._count.programCourses > 0) {
    const updated = await prisma.course.update({
      where: { id: course.id },
      data: { isActive: false },
    });
    return updated;
  }

  const result = await prisma.course.delete({
    where: { id: course.id },
  });

  return result;
};

// Curriculum Management (ProgramCourse)
const addCourseToProgramCurriculum = async (
  programId: string,
  payload: IAddProgramCoursePayload,
) => {
  const { courseId, recommendedSemester, isOptional } = payload;

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) {
    throw new AppError(404, "Program not found");
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError(404, "Course not found");
  }

  const existing = await prisma.programCourse.findUnique({
    where: {
      programId_courseId: {
        programId,
        courseId,
      },
    },
  });

  if (existing) {
    throw new AppError(409, "Course is already part of this program curriculum");
  }

  const programCourse = await prisma.programCourse.create({
    data: {
      programId,
      courseId,
      recommendedSemester,
      isOptional: isOptional ?? false,
    },
    include: {
      program: true,
      course: true,
    },
  });

  return programCourse;
};

const removeCourseFromProgramCurriculum = async (programId: string, courseId: string) => {
  const programCourse = await prisma.programCourse.findUnique({
    where: {
      programId_courseId: {
        programId,
        courseId,
      },
    },
  });

  if (!programCourse) {
    throw new AppError(404, "Course is not in this program curriculum");
  }

  await prisma.programCourse.delete({
    where: {
      id: programCourse.id,
    },
  });

  return null;
};

// Prerequisite Graph Cycle Detection helper
const wouldCreateCycle = async (
  targetCourseId: string,
  newPrerequisiteId: string,
): Promise<boolean> => {
  // BFS search starting from newPrerequisiteId to see if targetCourseId is reachable
  const queue: string[] = [newPrerequisiteId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) break;
    if (currentId === targetCourseId) {
      return true; // Cycle detected!
    }

    if (!visited.has(currentId)) {
      visited.add(currentId);

      const prerequisitesOfCurrent = await prisma.coursePrerequisite.findMany({
        where: { courseId: currentId },
        select: { prerequisiteId: true },
      });

      for (const item of prerequisitesOfCurrent) {
        if (!visited.has(item.prerequisiteId)) {
          queue.push(item.prerequisiteId);
        }
      }
    }
  }

  return false;
};

// Prerequisite Management
const addPrerequisiteToCourse = async (courseId: string, payload: IAddPrerequisitePayload) => {
  const { prerequisiteId, minGradePoint } = payload;

  if (courseId === prerequisiteId) {
    throw new AppError(400, "A course cannot be its own prerequisite");
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError(404, "Target course not found");
  }

  const prerequisiteCourse = await prisma.course.findUnique({ where: { id: prerequisiteId } });
  if (!prerequisiteCourse) {
    throw new AppError(404, "Prerequisite course not found");
  }

  const existing = await prisma.coursePrerequisite.findUnique({
    where: {
      courseId_prerequisiteId: {
        courseId,
        prerequisiteId,
      },
    },
  });

  if (existing) {
    throw new AppError(409, "Prerequisite already added to this course");
  }

  // Check graph cycle
  const isCycle = await wouldCreateCycle(courseId, prerequisiteId);
  if (isCycle) {
    throw new AppError(400, "Adding this prerequisite would create a circular dependency");
  }

  const coursePrerequisite = await prisma.coursePrerequisite.create({
    data: {
      courseId,
      prerequisiteId,
      minGradePoint: minGradePoint ?? 2.0,
    },
    include: {
      course: true,
      prerequisite: true,
    },
  });

  return coursePrerequisite;
};

const removePrerequisiteFromCourse = async (courseId: string, prerequisiteId: string) => {
  const prerequisite = await prisma.coursePrerequisite.findUnique({
    where: {
      courseId_prerequisiteId: {
        courseId,
        prerequisiteId,
      },
    },
  });

  if (!prerequisite) {
    throw new AppError(404, "Prerequisite mapping not found");
  }

  await prisma.coursePrerequisite.delete({
    where: { id: prerequisite.id },
  });

  return null;
};

const getCoursePrerequisitesFromDB = async (courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError(404, "Course not found");
  }

  const prerequisites = await prisma.coursePrerequisite.findMany({
    where: { courseId },
    include: {
      prerequisite: true,
    },
  });

  return prerequisites;
};

export const CourseService = {
  createCourseInDB,
  getAllCoursesFromDB,
  getCourseByIdFromDB,
  updateCourseInDB,
  deleteCourseFromDB,
  addCourseToProgramCurriculum,
  removeCourseFromProgramCurriculum,
  addPrerequisiteToCourse,
  removePrerequisiteFromCourse,
  getCoursePrerequisitesFromDB,
};
