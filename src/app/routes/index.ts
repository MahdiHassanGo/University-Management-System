import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route.js";
import { InstructorRoutes } from "../module/instructor/instructor.route.js";
import { StudentRoutes } from "../module/student/student.route.js";
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
];

for (const route of moduleRoutes) {
  router.use(route.path, route.route);
}

export default router;
