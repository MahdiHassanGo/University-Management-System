import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { AttendanceController } from "../attendance/attendance.controller.js";
import { AttendanceValidation } from "../attendance/attendance.validation.js";
import { SectionController } from "./section.controller.js";
import { SectionValidation } from "./section.validation.js";

const router = Router();

router.get("/available", checkAuth("STUDENT"), SectionController.getAvailableSectionsForStudent);

router.get(
  "/",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  SectionController.getAllSections,
);

router.get(
  "/:sectionId/students",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR"),
  SectionController.getSectionStudents,
);

router.get(
  "/:sectionId",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  SectionController.getSectionById,
);

router.post(
  "/",
  checkAuth("SUPER_ADMIN"),
  validateRequest(SectionValidation.createSectionValidationSchema),
  SectionController.createSection,
);

router.patch(
  "/:sectionId",
  checkAuth("SUPER_ADMIN"),
  validateRequest(SectionValidation.updateSectionValidationSchema),
  SectionController.updateSection,
);

router.delete("/:sectionId", checkAuth("SUPER_ADMIN"), SectionController.deleteSection);

// Attendance Sessions for Section
router.post(
  "/:sectionId/attendance-sessions",
  checkAuth("INSTRUCTOR", "SUPER_ADMIN"),
  validateRequest(AttendanceValidation.createAttendanceSessionValidationSchema),
  AttendanceController.createAttendanceSession,
);

router.get(
  "/:sectionId/attendance",
  checkAuth("INSTRUCTOR", "SUPER_ADMIN"),
  AttendanceController.getSectionAttendance,
);

export const SectionRoutes = router;
