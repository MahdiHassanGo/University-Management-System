import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { EnrollmentController } from "./enrollment.controller.js";
import { EnrollmentValidation } from "./enrollment.validation.js";

const router = Router();

router.get("/me", checkAuth("STUDENT"), EnrollmentController.getMyEnrollments);

router.post(
  "/",
  checkAuth("STUDENT"),
  validateRequest(EnrollmentValidation.createEnrollmentValidationSchema),
  EnrollmentController.enrollCourse,
);

router.patch(
  "/:enrollmentId/drop",
  checkAuth("STUDENT", "SUPER_ADMIN"),
  EnrollmentController.dropCourse,
);

router.get("/", checkAuth("SUPER_ADMIN"), EnrollmentController.getAllEnrollments);

export const EnrollmentRoutes = router;
