import type { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import {
  calculatePagination,
  createPaginatedResponse,
  type IPaginationOptions,
} from "../../utils/pagination.js";
import type { ICreateEnrollmentPayload, IEnrollmentFilterOptions } from "./enrollment.interface.js";

const isTimeOverlapping = (startA: string, endA: string, startB: string, endB: string): boolean => {
  return startA < endB && endA > startB;
};

const enrollCourseInDB = async (userId: string, payload: ICreateEnrollmentPayload) => {
  const { sectionId } = payload;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Student check
    const student = await tx.student.findUnique({
      where: { userId },
      include: { program: true },
    });

    if (student?.academicStatus !== "ACTIVE") {
      throw new AppError(403, "Active student profile required for course registration");
    }

    // 2. Section & Semester check
    const section = await tx.section.findUnique({
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
        schedules: true,
      },
    });

    if (!section) {
      throw new AppError(404, "Section not found");
    }

    if (section.status !== "OPEN") {
      throw new AppError(400, "Section is not open for registration");
    }

    if (section.enrolledCount >= section.capacity) {
      throw new AppError(400, "Section capacity is full");
    }

    const now = new Date();
    if (
      section.semester.status !== "REGISTRATION_OPEN" ||
      now < section.semester.registrationStart ||
      now > section.semester.registrationEnd
    ) {
      throw new AppError(400, "Registration window is not currently open for this semester");
    }

    // 3. Program Curriculum Check
    const programCourse = await tx.programCourse.findUnique({
      where: {
        programId_courseId: {
          programId: student.programId,
          courseId: section.courseId,
        },
      },
    });

    if (!programCourse) {
      throw new AppError(400, "Selected course is not included in your program curriculum");
    }

    // 4. Duplicate Enrollment Check (same course, same semester)
    const existingEnrollment = await tx.enrollment.findFirst({
      where: {
        studentId: student.id,
        status: "ENROLLED",
        section: {
          courseId: section.courseId,
          semesterId: section.semesterId,
        },
      },
      include: {
        section: true,
      },
    });

    if (existingEnrollment) {
      throw new AppError(
        409,
        `You are already enrolled in section ${existingEnrollment.section.sectionNumber} for this course`,
      );
    }

    // 5. Prerequisite Grade Check
    for (const prereq of section.course.prerequisites) {
      const passedResult = await tx.courseResult.findFirst({
        where: {
          publicationStatus: "PUBLISHED",
          gradePoint: { gte: prereq.minGradePoint },
          enrollment: {
            studentId: student.id,
            section: {
              courseId: prereq.prerequisiteId,
            },
          },
        },
      });

      if (!passedResult) {
        throw new AppError(
          400,
          `Prerequisite requirement not met: Course '${prereq.prerequisite.code}' with minimum grade point ${prereq.minGradePoint} required`,
        );
      }
    }

    // 6. Max Credit Limit & Schedule Conflict Check against active student enrollments
    const activeEnrollments = await tx.enrollment.findMany({
      where: {
        studentId: student.id,
        status: "ENROLLED",
        section: {
          semesterId: section.semesterId,
        },
      },
      include: {
        section: {
          include: {
            course: true,
            schedules: true,
          },
        },
      },
    });

    const currentEnrolledCredits = activeEnrollments.reduce(
      (sum, e) => sum + e.section.course.credit,
      0,
    );

    const maxCredits = student.program.maxSemesterCredits;
    if (currentEnrolledCredits + section.course.credit > maxCredits) {
      throw new AppError(
        400,
        `Credit limit exceeded: Registering ${section.course.credit} credits brings total to ${currentEnrolledCredits + section.course.credit}, exceeding maximum allowed ${maxCredits} credits`,
      );
    }

    // Student schedule conflict check
    for (const newSched of section.schedules) {
      for (const active of activeEnrollments) {
        for (const existingSched of active.section.schedules) {
          if (
            newSched.dayOfWeek === existingSched.dayOfWeek &&
            isTimeOverlapping(
              newSched.startTime,
              newSched.endTime,
              existingSched.startTime,
              existingSched.endTime,
            )
          ) {
            throw new AppError(
              409,
              `Time conflict: Class schedule overlaps with '${active.section.course.code}' on day ${newSched.dayOfWeek} (${existingSched.startTime}-${existingSched.endTime})`,
            );
          }
        }
      }
    }

    // 7. Atomic Enrollment & Capacity update
    const enrollment = await tx.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: section.id,
        status: "ENROLLED",
      },
      include: {
        student: true,
        section: {
          include: {
            course: true,
            semester: true,
            instructor: true,
            schedules: true,
          },
        },
      },
    });

    await tx.section.update({
      where: { id: sectionId },
      data: {
        enrolledCount: { increment: 1 },
      },
    });

    // Create Notification
    await tx.notification.create({
      data: {
        recipientId: userId,
        type: "ACADEMIC",
        title: "Course Registration Success",
        message: `Successfully enrolled in ${section.course.code} Section ${section.sectionNumber} for ${section.semester.term} ${section.semester.year}`,
        relatedEntityId: enrollment.id,
      },
    });

    return enrollment;
  });

  return result;
};

const dropCourseInDB = async (userId: string, role: string, enrollmentId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        section: {
          include: {
            course: true,
            semester: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new AppError(404, "Enrollment record not found");
    }

    if (role === "STUDENT" && enrollment.student.userId !== userId) {
      throw new AppError(403, "Forbidden! You can only drop your own course enrollments.");
    }

    if (enrollment.status !== "ENROLLED") {
      throw new AppError(400, `Cannot drop course with status '${enrollment.status}'`);
    }

    const updatedEnrollment = await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "DROPPED",
        droppedAt: new Date(),
      },
      include: {
        section: {
          include: {
            course: true,
            semester: true,
          },
        },
      },
    });

    if (enrollment.section.enrolledCount > 0) {
      await tx.section.update({
        where: { id: enrollment.sectionId },
        data: {
          enrolledCount: { decrement: 1 },
        },
      });
    }

    // Create Notification
    await tx.notification.create({
      data: {
        recipientId: enrollment.student.userId,
        type: "ACADEMIC",
        title: "Course Dropped",
        message: `You have dropped ${enrollment.section.course.code} Section ${enrollment.section.sectionNumber}`,
        relatedEntityId: enrollment.id,
      },
    });

    return updatedEnrollment;
  });

  return result;
};

const getMyEnrollmentsFromDB = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    include: {
      section: {
        include: {
          course: true,
          semester: true,
          instructor: true,
          schedules: true,
        },
      },
      courseResult: true,
    },
    orderBy: { enrolledAt: "desc" },
  });

  return enrollments;
};

const getAllEnrollmentsFromDB = async (
  filters: IEnrollmentFilterOptions,
  options: IPaginationOptions,
) => {
  const { studentId, sectionId, status, semesterId } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const andConditions: Prisma.EnrollmentWhereInput[] = [];

  if (studentId) {
    andConditions.push({ studentId });
  }

  if (sectionId) {
    andConditions.push({ sectionId });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (semesterId) {
    andConditions.push({ section: { semesterId } });
  }

  const whereConditions: Prisma.EnrollmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        student: {
          include: {
            user: { select: { email: true } },
          },
        },
        section: {
          include: {
            course: true,
            semester: true,
            instructor: true,
          },
        },
        courseResult: true,
      },
    }),
    prisma.enrollment.count({ where: whereConditions }),
  ]);

  return createPaginatedResponse(items, total, page, limit);
};

export const EnrollmentService = {
  enrollCourseInDB,
  dropCourseInDB,
  getMyEnrollmentsFromDB,
  getAllEnrollmentsFromDB,
};
