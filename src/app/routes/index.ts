import { z } from "zod";
import prisma from "../lib/prisma.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import { Router } from "express";
import { AttendanceRoutes } from "../module/attendance/attendance.route.js";
import { AuditLogRoutes } from "../module/auditLog/auditLog.route.js";
import { AuthRoutes } from "../module/auth/auth.route.js";
import { CourseRoutes } from "../module/course/course.route.js";
import { DepartmentRoutes } from "../module/department/department.route.js";
import { EnrollmentRoutes } from "../module/enrollment/enrollment.route.js";
import { ExamRoutes } from "../module/exam/exam.route.js";
import { FeeRoutes } from "../module/fee/fee.route.js";
import { InstructorRoutes } from "../module/instructor/instructor.route.js";
import { NotificationRoutes } from "../module/notification/notification.route.js";
import { PaymentRoutes } from "../module/payment/payment.route.js";
import { ProgramRoutes } from "../module/program/program.route.js";
import { ReportRoutes } from "../module/report/report.route.js";
import { ResultRoutes } from "../module/result/result.route.js";
import { SectionRoutes } from "../module/section/section.route.js";
import { SemesterRoutes } from "../module/semester/semester.route.js";
import { StudentRoutes } from "../module/student/student.route.js";
import { TranscriptRoutes } from "../module/transcript/transcript.route.js";
import { UserRoutes } from "../module/user/user.route.js";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/audit-logs",
    route: AuditLogRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/students",
    route: StudentRoutes,
  },
  {
    path: "/instructors",
    route: InstructorRoutes,
  },
  {
    path: "/departments",
    route: DepartmentRoutes,
  },
  {
    path: "/programs",
    route: ProgramRoutes,
  },
  {
    path: "/courses",
    route: CourseRoutes,
  },
  {
    path: "/semesters",
    route: SemesterRoutes,
  },
  {
    path: "/sections",
    route: SectionRoutes,
  },
  {
    path: "/enrollments",
    route: EnrollmentRoutes,
  },
  {
    path: "/exams",
    route: ExamRoutes,
  },
  {
    path: "/attendance",
    route: AttendanceRoutes,
  },
  {
    path: "/results",
    route: ResultRoutes,
  },
  {
    path: "/transcripts",
    route: TranscriptRoutes,
  },
  {
    path: "/fees",
    route: FeeRoutes,
  },
  {
    path: "/payments",
    route: PaymentRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/reports",
    route: ReportRoutes,
  },
];

for (const route of moduleRoutes) {
  router.use(route.path, route.route);
}

router.get("/public/programs", catchAsync(async (_req,res)=>{
  const programs=await prisma.program.findMany({where:{isActive:true},include:{department:true},orderBy:{name:"asc"},take:100});
  res.json({success:true,message:"Active programs",data:programs});
}));
router.get("/public/semesters",catchAsync(async (req,res)=>{
  const status=z.enum(["DRAFT","REGISTRATION_OPEN","ONGOING","COMPLETED"]).optional().parse(req.query.status);
  const semesters=await prisma.academicSemester.findMany({where:{...(status?{status}:{}),NOT:{status:"DRAFT"}},orderBy:{registrationStart:"desc"},take:100});
  res.json({success:true,message:"Published semesters",data:semesters});
}));

router.post("/contact", catchAsync(async (req, res) => {
  const input = z.object({name:z.string().trim().min(1).max(100),email:z.string().email(),message:z.string().trim().min(10).max(2000)}).parse(req.body);
  const admins = await prisma.user.findMany({where:{role:"SUPER_ADMIN",status:"ACTIVE"},select:{id:true}});
  if (!admins.length) throw new AppError(503,"Support is temporarily unavailable. Please try again later.");
  await prisma.notification.createMany({data:admins.map(admin=>({recipientId:admin.id,type:"INQUIRY",title:`Campus inquiry: ${input.name}`,message:`From ${input.email}\n${input.message}`}))});
  res.status(201).json({success:true,message:"Inquiry received",data:null});
}));

export default router;
