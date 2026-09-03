import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import { calculateGradeAndPoint } from "../../utils/calculateGrade.js";

const calculateSectionResultsInDB = async (userId: string, role: string, sectionId: string) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      instructor: true,
      exams: {
        include: {
          results: true,
        },
      },
      enrollments: {
        where: { status: "ENROLLED" },
        include: {
          student: true,
        },
      },
    },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  if (role === "INSTRUCTOR" && section.instructor.userId !== userId) {
    throw new AppError(
      403,
      "Forbidden! You can only calculate results for your assigned sections.",
    );
  }

  if (section.exams.length === 0) {
    throw new AppError(400, "No exams exist for this section to calculate results");
  }

  const calculatedResults = await prisma.$transaction(async (tx) => {
    const results = [];

    for (const enrollment of section.enrollments) {
      let totalWeightedMarks = 0;

      for (const exam of section.exams) {
        const studentExamResult = exam.results.find((r) => r.studentId === enrollment.studentId);

        if (studentExamResult && exam.totalMarks > 0) {
          const obtainedPercentage = studentExamResult.marks / exam.totalMarks;
          const weightedMarks = obtainedPercentage * exam.weightPercentage;
          totalWeightedMarks += weightedMarks;
        }
      }

      const { letterGrade, gradePoint } = calculateGradeAndPoint(totalWeightedMarks);

      const courseResult = await tx.courseResult.upsert({
        where: { enrollmentId: enrollment.id },
        create: {
          enrollmentId: enrollment.id,
          totalMarks: Number(totalWeightedMarks.toFixed(2)),
          letterGrade,
          gradePoint,
          publicationStatus: "DRAFT",
        },
        update: {
          totalMarks: Number(totalWeightedMarks.toFixed(2)),
          letterGrade,
          gradePoint,
        },
        include: {
          enrollment: {
            include: {
              student: true,
            },
          },
        },
      });

      results.push(courseResult);
    }

    return results;
  });

  return calculatedResults;
};

const publishSectionResultsInDB = async (userId: string, role: string, sectionId: string) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      instructor: true,
      course: true,
      semester: true,
      enrollments: {
        where: { status: "ENROLLED" },
        include: {
          student: true,
          courseResult: true,
        },
      },
    },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  if (role === "INSTRUCTOR" && section.instructor.userId !== userId) {
    throw new AppError(403, "Forbidden! You can only publish results for your assigned sections.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const publishedAt = new Date();

    const enrollmentIds = section.enrollments
      .filter((e) => e.courseResult !== null)
      .map((e) => e.id);

    if (enrollmentIds.length === 0) {
      throw new AppError(
        400,
        "No calculated course results found for this section. Calculate results first.",
      );
    }

    await tx.courseResult.updateMany({
      where: {
        enrollmentId: { in: enrollmentIds },
      },
      data: {
        publicationStatus: "PUBLISHED",
        publishedAt,
      },
    });

    // Send notifications to enrolled students
    for (const enrollment of section.enrollments) {
      if (enrollment.courseResult) {
        await tx.notification.create({
          data: {
            recipientId: enrollment.student.userId,
            type: "RESULT",
            title: "Course Result Published",
            message: `Your final result for ${section.course.code} (${section.semester.term} ${section.semester.year}) has been published. Grade: ${enrollment.courseResult.letterGrade}`,
            relatedEntityId: enrollment.courseResult.id,
          },
        });
      }
    }

    return { publishedCount: enrollmentIds.length, publishedAt };
  });

  return result;
};

const getMyPublishedResultsFromDB = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const results = await prisma.courseResult.findMany({
    where: {
      publicationStatus: "PUBLISHED",
      enrollment: {
        studentId: student.id,
      },
    },
    include: {
      enrollment: {
        include: {
          section: {
            include: {
              course: true,
              semester: true,
            },
          },
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  return results;
};

export const ResultService = {
  calculateSectionResultsInDB,
  publishSectionResultsInDB,
  getMyPublishedResultsFromDB,
};
