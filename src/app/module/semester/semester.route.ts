import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { SemesterController } from "./semester.controller.js";
import { SemesterValidation } from "./semester.validation.js";

const router = Router();

router.get(
  "/",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  SemesterController.getAllSemesters,
);

router.get(
  "/:id",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  SemesterController.getSemesterById,
);

router.post(
  "/",
  checkAuth("SUPER_ADMIN"),
  validateRequest(SemesterValidation.createSemesterValidationSchema),
  SemesterController.createSemester,
);

router.patch(
  "/:id",
  checkAuth("SUPER_ADMIN"),
  validateRequest(SemesterValidation.updateSemesterValidationSchema),
  SemesterController.updateSemester,
);

router.patch(
  "/:id/status",
  checkAuth("SUPER_ADMIN"),
  validateRequest(SemesterValidation.updateSemesterStatusValidationSchema),
  SemesterController.updateSemesterStatus,
);

export const SemesterRoutes = router;
