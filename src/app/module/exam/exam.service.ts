import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import type {
  IBulkExamMarksPayload,
  ICreateExamPayload,
  IUpdateExamPayload,
} from "./exam.interface.js";

const createExamInDB = async (
  userId: string,
  role: string,
  sectionId: string,
  payload: ICreateExamPayload,
) => {
  const { title, totalMarks, weightPercentage, heldAt, status } = payload;

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      instructor: true,
      exams: true,
    },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  if (role === "INSTRUCTOR" && section.instructor.userId !== userId) {
    throw new AppError(403, "Forbidden! You can only manage exams for your assigned sections.");
  }

  const existingWeightSum = section.exams.reduce((sum, e) => sum + e.weightPercentage, 0);

  if (existingWeightSum + weightPercentage > 100) {
    throw new AppError(
      400,
      `Total exam weight percentage cannot exceed 100%. Existing total: ${existingWeightSum}%, attempting to add: ${weightPercentage}%`,
    );
  }

  const exam = await prisma.exam.create({
    data: {
      sectionId,
      title,
      totalMarks,
      weightPercentage,
      heldAt: heldAt ? new Date(heldAt) : null,
      status: status || "DRAFT",
    },
    include: {
      section: {
        include: {
          course: true,
        },
      },
    },
  });

  return exam;
};

const getSectionExamsFromDB = async (userId: string, role: string, sectionId: string) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { instructor: true },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  if (role === "INSTRUCTOR" && section.instructor.userId !== userId) {
    throw new AppError(403, "Forbidden! You can only view exams for your assigned sections.");
  }

  const exams = await prisma.exam.findMany({
    where: { sectionId },
    include: {
      _count: {
        select: {
          results: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return exams;
};

const updateExamInDB = async (
  userId: string,
  role: string,
  examId: string,
  payload: IUpdateExamPayload,
) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      section: {
        include: {
          instructor: true,
          exams: true,
        },
      },
    },
  });

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  if (role === "INSTRUCTOR" && exam.section.instructor.userId !== userId) {
    throw new AppError(403, "Forbidden! You can only edit exams for your assigned sections.");
  }

  if (payload.weightPercentage !== undefined) {
    const existingWeightSum = exam.section.exams
      .filter((e) => e.id !== examId)
      .reduce((sum, e) => sum + e.weightPercentage, 0);

    if (existingWeightSum + payload.weightPercentage > 100) {
      throw new AppError(
        400,
        `Total exam weight percentage cannot exceed 100%. Other exams total: ${existingWeightSum}%, attempting to set: ${payload.weightPercentage}%`,
      );
    }
  }

  const updatedExam = await prisma.exam.update({
    where: { id: examId },
    data: {
      ...payload,
      ...(payload.heldAt && { heldAt: new Date(payload.heldAt) }),
    },
  });

  return updatedExam;
};

const deleteExamFromDB = async (userId: string, role: string, examId: string) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      section: {
        include: { instructor: true },
      },
    },
  });

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  if (role === "INSTRUCTOR" && exam.section.instructor.userId !== userId) {
    throw new AppError(403, "Forbidden! You can only delete exams for your assigned sections.");
  }

  await prisma.exam.delete({
    where: { id: examId },
  });

  return null;
};

const bulkMarkExamResultsInDB = async (
  userId: string,
  role: string,
  examId: string,
  payload: IBulkExamMarksPayload,
) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      section: {
        include: { instructor: true },
      },
    },
  });

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  if (role === "INSTRUCTOR" && exam.section.instructor.userId !== userId) {
    throw new AppError(403, "Forbidden! You can only enter marks for your assigned sections.");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      sectionId: exam.sectionId,
      status: "ENROLLED",
    },
    select: { studentId: true },
  });

  const enrolledStudentIds = new Set(enrollments.map((e) => e.studentId));

  for (const item of payload.results) {
    if (!enrolledStudentIds.has(item.studentId)) {
      throw new AppError(
        400,
        `Student ID '${item.studentId}' is not actively enrolled in this section`,
      );
    }
    if (item.marks > exam.totalMarks) {
      throw new AppError(
        400,
        `Marks (${item.marks}) cannot exceed exam total marks (${exam.totalMarks})`,
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const savedResults = [];
    for (const item of payload.results) {
      const res = await tx.examResult.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: item.studentId,
          },
        },
        create: {
          examId,
          studentId: item.studentId,
          marks: item.marks,
        },
        update: {
          marks: item.marks,
        },
        include: {
          student: true,
        },
      });
      savedResults.push(res);
    }

    // Auto mark exam status as PUBLISHED/COMPLETED if not DRAFT
    if (exam.status === "DRAFT") {
      await tx.exam.update({
        where: { id: examId },
        data: { status: "PUBLISHED" },
      });
    }

    return savedResults;
  });

  return result;
};

const getExamResultsFromDB = async (userId: string, role: string, examId: string) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      section: {
        include: { instructor: true },
      },
    },
  });

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  if (role === "INSTRUCTOR" && exam.section.instructor.userId !== userId) {
    throw new AppError(403, "Forbidden! You can only view results for your assigned sections.");
  }

  const results = await prisma.examResult.findMany({
    where: { examId },
    include: {
      student: {
        include: {
          user: {
            select: { email: true },
          },
        },
      },
    },
    orderBy: {
      student: { studentId: "asc" },
    },
  });

  return results;
};

export const ExamService = {
  createExamInDB,
  getSectionExamsFromDB,
  updateExamInDB,
  deleteExamFromDB,
  bulkMarkExamResultsInDB,
  getExamResultsFromDB,
};
