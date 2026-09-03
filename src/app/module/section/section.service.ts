import type { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import {
  calculatePagination,
  createPaginatedResponse,
  type IPaginationOptions,
} from "../../utils/pagination.js";
import type {
  ICreateSectionPayload,
  ISchedulePayload,
  ISectionFilterOptions,
  IUpdateSectionPayload,
} from "./section.interface.js";

const isTimeOverlapping = (startA: string, endA: string, startB: string, endB: string): boolean => {
  return startA < endB && endA > startB;
};

const checkScheduleConflicts = async (
  semesterId: string,
  instructorId: string,
  schedules: ISchedulePayload[],
  excludeSectionId?: string,
) => {
  for (const sched of schedules) {
    if (sched.startTime >= sched.endTime) {
      throw new AppError(
        400,
        `Invalid schedule time: startTime (${sched.startTime}) must be before endTime (${sched.endTime})`,
      );
    }

    // 1. Room conflict check
    const roomSchedules = await prisma.sectionSchedule.findMany({
      where: {
        dayOfWeek: sched.dayOfWeek,
        room: sched.room,
        section: {
          semesterId,
          ...(excludeSectionId && { id: { not: excludeSectionId } }),
        },
      },
      include: {
        section: true,
      },
    });

    for (const existing of roomSchedules) {
      if (isTimeOverlapping(sched.startTime, sched.endTime, existing.startTime, existing.endTime)) {
        throw new AppError(
          409,
          `Room conflict: Room ${sched.room} is already assigned to another section on day ${sched.dayOfWeek} (${existing.startTime}-${existing.endTime})`,
        );
      }
    }

    // 2. Instructor conflict check
    const instructorSchedules = await prisma.sectionSchedule.findMany({
      where: {
        dayOfWeek: sched.dayOfWeek,
        section: {
          semesterId,
          instructorId,
          ...(excludeSectionId && { id: { not: excludeSectionId } }),
        },
      },
      include: {
        section: true,
      },
    });

    for (const existing of instructorSchedules) {
      if (isTimeOverlapping(sched.startTime, sched.endTime, existing.startTime, existing.endTime)) {
        throw new AppError(
          409,
          `Instructor conflict: Instructor is already assigned to teach another section on day ${sched.dayOfWeek} (${existing.startTime}-${existing.endTime})`,
        );
      }
    }
  }
};

const createSectionInDB = async (payload: ICreateSectionPayload) => {
  const { courseId, semesterId, instructorId, sectionNumber, capacity, status, schedules } =
    payload;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course?.isActive) {
    throw new AppError(404, "Course not found or inactive");
  }

  const semester = await prisma.academicSemester.findUnique({ where: { id: semesterId } });
  if (!semester) {
    throw new AppError(404, "Academic semester not found");
  }

  const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } });
  if (!instructor) {
    throw new AppError(404, "Instructor not found");
  }

  const existingSection = await prisma.section.findUnique({
    where: {
      courseId_semesterId_sectionNumber: {
        courseId,
        semesterId,
        sectionNumber,
      },
    },
  });

  if (existingSection) {
    throw new AppError(409, `Section ${sectionNumber} already exists for this course and semester`);
  }

  // Check schedule conflicts
  await checkScheduleConflicts(semesterId, instructorId, schedules);

  const section = await prisma.$transaction(async (tx) => {
    const newSection = await tx.section.create({
      data: {
        courseId,
        semesterId,
        instructorId,
        sectionNumber,
        capacity,
        status: status || "OPEN",
        schedules: {
          create: schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            room: s.room,
          })),
        },
      },
      include: {
        course: true,
        semester: true,
        instructor: true,
        schedules: true,
      },
    });

    return newSection;
  });

  return section;
};

const getAllSectionsFromDB = async (
  filters: ISectionFilterOptions,
  options: IPaginationOptions,
) => {
  const { courseId, semesterId, instructorId, status, searchTerm } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const andConditions: Prisma.SectionWhereInput[] = [];

  if (courseId) {
    andConditions.push({ courseId });
  }

  if (semesterId) {
    andConditions.push({ semesterId });
  }

  if (instructorId) {
    andConditions.push({ instructorId });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (searchTerm) {
    andConditions.push({
      OR: [
        { course: { code: { contains: searchTerm, mode: "insensitive" } } },
        { course: { title: { contains: searchTerm, mode: "insensitive" } } },
        { instructor: { name: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  const whereConditions: Prisma.SectionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [items, total] = await Promise.all([
    prisma.section.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        course: true,
        semester: true,
        instructor: true,
        schedules: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    }),
    prisma.section.count({ where: whereConditions }),
  ]);

  return createPaginatedResponse(items, total, page, limit);
};

const getAvailableSectionsForStudentFromDB = async (
  userId: string,
  options: IPaginationOptions,
) => {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const openSemester = await prisma.academicSemester.findFirst({
    where: { status: "REGISTRATION_OPEN" },
  });

  if (!openSemester) {
    return createPaginatedResponse([], 0, Number(options.page) || 1, Number(options.limit) || 10);
  }

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const whereConditions: Prisma.SectionWhereInput = {
    semesterId: openSemester.id,
    status: "OPEN",
    course: {
      programCourses: {
        some: {
          programId: student.programId,
        },
      },
    },
  };

  const [items, total] = await Promise.all([
    prisma.section.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        course: {
          include: {
            prerequisites: {
              include: {
                prerequisite: true,
              },
            },
          },
        },
        semester: true,
        instructor: true,
        schedules: true,
      },
    }),
    prisma.section.count({ where: whereConditions }),
  ]);

  return createPaginatedResponse(items, total, page, limit);
};

const getSectionByIdFromDB = async (sectionId: string) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      course: {
        include: {
          prerequisites: {
            include: {
              prerequisite: true,
            },
          },
        },
      },
      semester: true,
      instructor: true,
      schedules: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  return section;
};

const getSectionStudentsFromDB = async (sectionId: string, userId: string, role: string) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      instructor: true,
    },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  if (role === "INSTRUCTOR" && section.instructor.userId !== userId) {
    throw new AppError(403, "Forbidden! You can only view students in your own assigned sections.");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      sectionId,
      status: "ENROLLED",
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              email: true,
            },
          },
          program: true,
        },
      },
    },
    orderBy: {
      student: {
        studentId: "asc",
      },
    },
  });

  return enrollments;
};

const updateSectionInDB = async (sectionId: string, payload: IUpdateSectionPayload) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { schedules: true },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  const targetInstructorId = payload.instructorId || section.instructorId;
  const targetSchedules = payload.schedules || section.schedules;

  if (payload.instructorId || payload.schedules) {
    await checkScheduleConflicts(
      section.semesterId,
      targetInstructorId,
      targetSchedules,
      sectionId,
    );
  }

  if (payload.capacity !== undefined && payload.capacity < section.enrolledCount) {
    throw new AppError(
      400,
      `Capacity cannot be reduced below current enrolled count (${section.enrolledCount})`,
    );
  }

  const updatedSection = await prisma.$transaction(async (tx) => {
    if (payload.schedules) {
      await tx.sectionSchedule.deleteMany({ where: { sectionId } });
    }

    return await tx.section.update({
      where: { id: sectionId },
      data: {
        ...(payload.instructorId && { instructorId: payload.instructorId }),
        ...(payload.capacity !== undefined && { capacity: payload.capacity }),
        ...(payload.status && { status: payload.status }),
        ...(payload.schedules && {
          schedules: {
            create: payload.schedules.map((s) => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.room,
            })),
          },
        }),
      },
      include: {
        course: true,
        semester: true,
        instructor: true,
        schedules: true,
      },
    });
  });

  return updatedSection;
};

const deleteSectionFromDB = async (sectionId: string) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  if (section._count.enrollments > 0) {
    throw new AppError(
      400,
      "Cannot delete section with existing student enrollments. Update status to CLOSED or COMPLETED instead.",
    );
  }

  await prisma.section.delete({
    where: { id: sectionId },
  });

  return null;
};

export const SectionService = {
  createSectionInDB,
  getAllSectionsFromDB,
  getAvailableSectionsForStudentFromDB,
  getSectionByIdFromDB,
  getSectionStudentsFromDB,
  updateSectionInDB,
  deleteSectionFromDB,
};
