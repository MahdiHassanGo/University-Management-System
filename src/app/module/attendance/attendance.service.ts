import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import type {
  IBulkMarkAttendancePayload,
  ICreateAttendanceSessionPayload,
  IUpdateAttendanceRecordPayload,
} from "./attendance.interface.js";

const createAttendanceSessionInDB = async (
  userId: string,
  role: string,
  sectionId: string,
  payload: ICreateAttendanceSessionPayload,
) => {
  const { heldAt, topic } = payload;

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { instructor: true },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  if (role === "INSTRUCTOR" && section.instructor.userId !== userId) {
    throw new AppError(
      403,
      "Forbidden! You can only create attendance sessions for your assigned sections.",
    );
  }

  const heldDate = new Date(heldAt);

  const existingSession = await prisma.attendanceSession.findUnique({
    where: {
      sectionId_heldAt: {
        sectionId,
        heldAt: heldDate,
      },
    },
  });

  if (existingSession) {
    throw new AppError(409, "Attendance session already exists for this date and time");
  }

  const session = await prisma.attendanceSession.create({
    data: {
      sectionId,
      heldAt: heldDate,
      topic,
    },
    include: {
      section: {
        include: {
          course: true,
        },
      },
    },
  });

  return session;
};

const bulkMarkAttendanceInDB = async (
  userId: string,
  role: string,
  sessionId: string,
  payload: IBulkMarkAttendancePayload,
) => {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      section: {
        include: { instructor: true },
      },
    },
  });

  if (!session) {
    throw new AppError(404, "Attendance session not found");
  }

  if (role === "INSTRUCTOR" && session.section.instructor.userId !== userId) {
    throw new AppError(403, "Forbidden! You can only mark attendance for your assigned sections.");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      sectionId: session.sectionId,
      status: "ENROLLED",
    },
    select: { studentId: true },
  });

  const enrolledStudentIds = new Set(enrollments.map((e) => e.studentId));

  for (const rec of payload.records) {
    if (!enrolledStudentIds.has(rec.studentId)) {
      throw new AppError(
        400,
        `Student with ID '${rec.studentId}' is not actively enrolled in this section`,
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const records = [];
    for (const rec of payload.records) {
      const record = await tx.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId: rec.studentId,
          },
        },
        create: {
          sessionId,
          studentId: rec.studentId,
          status: rec.status,
          note: rec.note,
        },
        update: {
          status: rec.status,
          note: rec.note,
        },
        include: {
          student: true,
        },
      });
      records.push(record);
    }
    return records;
  });

  return result;
};

const updateAttendanceRecordInDB = async (
  userId: string,
  role: string,
  recordId: string,
  payload: IUpdateAttendanceRecordPayload,
) => {
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: recordId },
    include: {
      session: {
        include: {
          section: {
            include: { instructor: true },
          },
        },
      },
    },
  });

  if (!record) {
    throw new AppError(404, "Attendance record not found");
  }

  if (role === "INSTRUCTOR" && record.session.section.instructor.userId !== userId) {
    throw new AppError(
      403,
      "Forbidden! You can only modify attendance records for your assigned sections.",
    );
  }

  const updatedRecord = await prisma.attendanceRecord.update({
    where: { id: recordId },
    data: payload,
    include: {
      student: true,
    },
  });

  return updatedRecord;
};

const getSectionAttendanceFromDB = async (userId: string, role: string, sectionId: string) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { instructor: true },
  });

  if (!section) {
    throw new AppError(404, "Section not found");
  }

  if (role === "INSTRUCTOR" && section.instructor.userId !== userId) {
    throw new AppError(403, "Forbidden! You can only view attendance for your assigned sections.");
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: { sectionId },
    include: {
      records: {
        include: {
          student: true,
        },
      },
    },
    orderBy: { heldAt: "asc" },
  });

  return sessions;
};

const getMyAttendanceFromDB = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: student.id },
    include: {
      session: {
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
    orderBy: { session: { heldAt: "desc" } },
  });

  // Calculate attendance summaries grouped by section
  const sectionSummaryMap = new Map<
    string,
    {
      sectionId: string;
      courseCode: string;
      courseTitle: string;
      sectionNumber: number;
      semesterTerm: string;
      semesterYear: number;
      totalSessions: number;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      excusedCount: number;
      percentage: number;
    }
  >();

  for (const rec of records) {
    const sec = rec.session.section;
    const secId = sec.id;

    let summary = sectionSummaryMap.get(secId);
    if (!summary) {
      summary = {
        sectionId: secId,
        courseCode: sec.course.code,
        courseTitle: sec.course.title,
        sectionNumber: sec.sectionNumber,
        semesterTerm: sec.semester.term,
        semesterYear: sec.semester.year,
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        percentage: 0,
      };
      sectionSummaryMap.set(secId, summary);
    }

    summary.totalSessions += 1;

    if (rec.status === "PRESENT") summary.presentCount += 1;
    else if (rec.status === "ABSENT") summary.absentCount += 1;
    else if (rec.status === "LATE") summary.lateCount += 1;
    else if (rec.status === "EXCUSED") summary.excusedCount += 1;
  }

  const summaries = Array.from(sectionSummaryMap.values()).map((summary) => {
    // Attendance percentage calculation: PRESENT + LATE counts as attended
    const attended = summary.presentCount + summary.lateCount + summary.excusedCount;
    summary.percentage =
      summary.totalSessions > 0 ? Number(((attended / summary.totalSessions) * 100).toFixed(2)) : 0;
    return summary;
  });

  return {
    summaries,
    records,
  };
};

export const AttendanceService = {
  createAttendanceSessionInDB,
  bulkMarkAttendanceInDB,
  updateAttendanceRecordInDB,
  getSectionAttendanceFromDB,
  getMyAttendanceFromDB,
};
