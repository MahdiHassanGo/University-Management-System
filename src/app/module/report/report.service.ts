import prisma from "../../lib/prisma.js";

const getEnrollmentReportFromDB = async (semesterId?: string) => {
  const whereCondition = semesterId ? { semesterId } : {};

  const totalEnrollments = await prisma.enrollment.count({
    where: {
      status: "ENROLLED",
      ...(semesterId && { section: { semesterId } }),
    },
  });

  const enrollmentsByProgram = await prisma.student.groupBy({
    by: ["programId"],
    _count: { id: true },
    where: { academicStatus: "ACTIVE" },
  });

  const programDetails = await Promise.all(
    enrollmentsByProgram.map(async (item) => {
      const program = await prisma.program.findUnique({
        where: { id: item.programId },
        select: { code: true, name: true },
      });
      return {
        programId: item.programId,
        programCode: program?.code || "UNKNOWN",
        programName: program?.name || "Unknown Program",
        studentCount: item._count.id,
      };
    }),
  );

  const sectionCapacities = await prisma.section.aggregate({
    where: whereCondition,
    _sum: {
      capacity: true,
      enrolledCount: true,
    },
  });

  return {
    totalActiveEnrollments: totalEnrollments,
    totalSectionCapacity: sectionCapacities._sum.capacity || 0,
    totalStudentsEnrolled: sectionCapacities._sum.enrolledCount || 0,
    enrollmentsByProgram: programDetails,
  };
};

const getAttendanceReportFromDB = async (sectionId?: string) => {
  const totalSessions = await prisma.attendanceSession.count({
    where: sectionId ? { sectionId } : {},
  });

  const statusCounts = await prisma.attendanceRecord.groupBy({
    by: ["status"],
    _count: { id: true },
    where: sectionId ? { session: { sectionId } } : {},
  });

  const countsMap = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
  };

  for (const item of statusCounts) {
    if (item.status in countsMap) {
      countsMap[item.status as keyof typeof countsMap] = item._count.id;
    }
  }

  const totalRecords = Object.values(countsMap).reduce((a, b) => a + b, 0);
  const overallAttendanceRate =
    totalRecords > 0
      ? Number(
          (((countsMap.PRESENT + countsMap.LATE + countsMap.EXCUSED) / totalRecords) * 100).toFixed(
            2,
          ),
        )
      : 0;

  return {
    totalAttendanceSessions: totalSessions,
    totalRecordsMarked: totalRecords,
    breakdown: countsMap,
    overallAttendanceRate,
  };
};

const getResultReportFromDB = async (semesterId?: string) => {
  const publishedResults = await prisma.courseResult.findMany({
    where: {
      publicationStatus: "PUBLISHED",
      ...(semesterId && { enrollment: { section: { semesterId } } }),
    },
    select: {
      gradePoint: true,
      letterGrade: true,
    },
  });

  const totalResults = publishedResults.length;
  let passedCount = 0;
  let failedCount = 0;
  let gradeSum = 0;

  const gradeDistribution: Record<string, number> = {};

  for (const r of publishedResults) {
    gradeSum += r.gradePoint;
    if (r.gradePoint >= 2.0) passedCount += 1;
    else failedCount += 1;

    gradeDistribution[r.letterGrade] = (gradeDistribution[r.letterGrade] || 0) + 1;
  }

  const averageGradePoint = totalResults > 0 ? Number((gradeSum / totalResults).toFixed(2)) : 0.0;

  const passRate = totalResults > 0 ? Number(((passedCount / totalResults) * 100).toFixed(2)) : 0.0;

  return {
    totalPublishedCourseResults: totalResults,
    passedCount,
    failedCount,
    passRate,
    averageGradePoint,
    gradeDistribution,
  };
};

const getFinanceReportFromDB = async (semesterId?: string) => {
  const whereCondition = semesterId ? { semesterId } : {};

  const totalInvoices = await prisma.feeInvoice.count({ where: whereCondition });

  const statusAggregates = await prisma.feeInvoice.groupBy({
    by: ["status"],
    _sum: { amount: true },
    _count: { id: true },
    where: whereCondition,
  });

  let totalBilledAmount = 0;
  let totalCollectedAmount = 0;
  let totalUnpaidAmount = 0;

  for (const item of statusAggregates) {
    const amt = item._sum.amount || 0;
    totalBilledAmount += amt;
    if (item.status === "PAID") totalCollectedAmount += amt;
    else if (item.status === "UNPAID" || item.status === "OVERDUE") totalUnpaidAmount += amt;
  }

  const successfulPaymentsCount = await prisma.payment.count({
    where: {
      status: "PAID",
      ...(semesterId && { invoice: { semesterId } }),
    },
  });

  return {
    totalInvoices,
    totalBilledAmount,
    totalCollectedAmount,
    totalUnpaidAmount,
    successfulPaymentsCount,
    collectionRate:
      totalBilledAmount > 0
        ? Number(((totalCollectedAmount / totalBilledAmount) * 100).toFixed(2))
        : 0.0,
  };
};

export const ReportService = {
  getEnrollmentReportFromDB,
  getAttendanceReportFromDB,
  getResultReportFromDB,
  getFinanceReportFromDB,
};
