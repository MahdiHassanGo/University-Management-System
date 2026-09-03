import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";

const getStudentTranscriptFromDB = async (studentIdOrUserId: string, isUserId = false) => {
  const student = await prisma.student.findFirst({
    where: isUserId
      ? { userId: studentIdOrUserId }
      : { OR: [{ id: studentIdOrUserId }, { studentId: studentIdOrUserId }] },
    include: {
      program: {
        include: {
          department: true,
        },
      },
      admissionSemester: true,
    },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  // Fetch all published course results for student
  const courseResults = await prisma.courseResult.findMany({
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
    orderBy: [
      { enrollment: { section: { semester: { year: "asc" } } } },
      { enrollment: { section: { semester: { term: "asc" } } } },
    ],
  });

  // Group by semester
  const semesterMap = new Map<
    string,
    {
      semesterId: string;
      year: number;
      term: string;
      totalCredits: number;
      totalPoints: number;
      gpa: number;
      courses: Array<{
        courseId: string;
        courseCode: string;
        courseTitle: string;
        credit: number;
        letterGrade: string;
        gradePoint: number;
      }>;
    }
  >();

  // Map to track latest attempt per course for CGPA calculation
  const latestCourseAttemptMap = new Map<
    string,
    {
      credit: number;
      gradePoint: number;
      publishedAt: Date;
    }
  >();

  for (const result of courseResults) {
    const section = result.enrollment.section;
    const semester = section.semester;
    const course = section.course;
    const semId = semester.id;

    let semGroup = semesterMap.get(semId);
    if (!semGroup) {
      semGroup = {
        semesterId: semId,
        year: semester.year,
        term: semester.term,
        totalCredits: 0,
        totalPoints: 0,
        gpa: 0.0,
        courses: [],
      };
      semesterMap.set(semId, semGroup);
    }

    semGroup.courses.push({
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      credit: course.credit,
      letterGrade: result.letterGrade,
      gradePoint: result.gradePoint,
    });

    semGroup.totalCredits += course.credit;
    semGroup.totalPoints += course.credit * result.gradePoint;

    // Track latest attempt for course
    const publishedAt = result.publishedAt || result.createdAt;
    const existingAttempt = latestCourseAttemptMap.get(course.id);
    if (!existingAttempt || publishedAt > existingAttempt.publishedAt) {
      latestCourseAttemptMap.set(course.id, {
        credit: course.credit,
        gradePoint: result.gradePoint,
        publishedAt,
      });
    }
  }

  // Compute semester GPAs
  const semesters = Array.from(semesterMap.values()).map((sem) => {
    sem.gpa = sem.totalCredits > 0 ? Number((sem.totalPoints / sem.totalCredits).toFixed(2)) : 0.0;
    return sem;
  });

  // Compute CGPA based on latest course attempts
  let totalCgpaPoints = 0;
  let totalCgpaCredits = 0;

  for (const attempt of latestCourseAttemptMap.values()) {
    totalCgpaCredits += attempt.credit;
    totalCgpaPoints += attempt.credit * attempt.gradePoint;
  }

  const cgpa = totalCgpaCredits > 0 ? Number((totalCgpaPoints / totalCgpaCredits).toFixed(2)) : 0.0;

  return {
    student: {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      academicStatus: student.academicStatus,
      program: {
        code: student.program.code,
        name: student.program.name,
        department: student.program.department.name,
      },
      admissionSemester: `${student.admissionSemester.term} ${student.admissionSemester.year}`,
    },
    cgpa,
    totalEarnedCredits: totalCgpaCredits,
    semesters,
  };
};

export const TranscriptService = {
  getStudentTranscriptFromDB,
};
