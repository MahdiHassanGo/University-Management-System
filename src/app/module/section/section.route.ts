import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { AttendanceController } from "../attendance/attendance.controller.js";
import { AttendanceValidation } from "../attendance/attendance.validation.js";
import { ExamController } from "../exam/exam.controller.js";
import { ExamValidation } from "../exam/exam.validation.js";
import { ResultController } from "../result/result.controller.js";
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

// Exams for Section
router.post(
  "/:sectionId/exams",
  checkAuth("INSTRUCTOR", "SUPER_ADMIN"),
  validateRequest(ExamValidation.createExamValidationSchema),
  ExamController.createExam,
);

router.get(
  "/:sectionId/exams",
  checkAuth("INSTRUCTOR", "SUPER_ADMIN"),
  ExamController.getSectionExams,
);

// Results for Section
router.post(
  "/:sectionId/results/calculate",
  checkAuth("INSTRUCTOR", "SUPER_ADMIN"),
  ResultController.calculateSectionResults,
);

router.patch(
  "/:sectionId/results/publish",
  checkAuth("INSTRUCTOR", "SUPER_ADMIN"),
  ResultController.publishSectionResults,
);

export const SectionRoutes = router;
