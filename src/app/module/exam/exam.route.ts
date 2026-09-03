import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { ExamController } from "./exam.controller.js";
import { ExamValidation } from "./exam.validation.js";

const router = Router();

router.patch(
  "/:examId",
  checkAuth("INSTRUCTOR", "SUPER_ADMIN"),
  validateRequest(ExamValidation.updateExamValidationSchema),
  ExamController.updateExam,
);

router.delete("/:examId", checkAuth("INSTRUCTOR", "SUPER_ADMIN"), ExamController.deleteExam);

router.post(
  "/:examId/results/bulk",
  checkAuth("INSTRUCTOR", "SUPER_ADMIN"),
  validateRequest(ExamValidation.bulkExamMarksValidationSchema),
  ExamController.bulkMarkExamResults,
);

router.get(
  "/:examId/results",
  checkAuth("INSTRUCTOR", "SUPER_ADMIN"),
  ExamController.getExamResults,
);

export const ExamRoutes = router;
