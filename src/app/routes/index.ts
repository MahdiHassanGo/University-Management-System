import { Router } from "express";
import { AttendanceRoutes } from "../module/attendance/attendance.route.js";
import { AuthRoutes } from "../module/auth/auth.route.js";
import { CourseRoutes } from "../module/course/course.route.js";
import { DepartmentRoutes } from "../module/department/department.route.js";
import { EnrollmentRoutes } from "../module/enrollment/enrollment.route.js";
import { InstructorRoutes } from "../module/instructor/instructor.route.js";
import { ProgramRoutes } from "../module/program/program.route.js";
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
];

for (const route of moduleRoutes) {
  router.use(route.path, route.route);
}

export default router;
