import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { AttendanceController } from "./attendance.controller.js";
import { AttendanceValidation } from "./attendance.validation.js";

const router = Router();

// Student attendance summary route
router.get("/me", checkAuth("STUDENT"), AttendanceController.getMyAttendance);

// Attendance records bulk update
router.post(
  "/sessions/:sessionId/records/bulk",
  checkAuth("INSTRUCTOR", "SUPER_ADMIN"),
  validateRequest(AttendanceValidation.bulkMarkAttendanceValidationSchema),
  AttendanceController.bulkMarkAttendance,
);

router.patch(
  "/records/:recordId",
  checkAuth("INSTRUCTOR", "SUPER_ADMIN"),
  validateRequest(AttendanceValidation.updateAttendanceRecordValidationSchema),
  AttendanceController.updateAttendanceRecord,
);

export const AttendanceRoutes = router;
