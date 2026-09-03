import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import { ReportController } from "./report.controller.js";

const router = Router();

router.get("/enrollments", checkAuth("SUPER_ADMIN"), ReportController.getEnrollmentReport);

router.get("/attendance", checkAuth("SUPER_ADMIN"), ReportController.getAttendanceReport);

router.get("/results", checkAuth("SUPER_ADMIN"), ReportController.getResultReport);

router.get("/finance", checkAuth("SUPER_ADMIN"), ReportController.getFinanceReport);

export const ReportRoutes = router;
