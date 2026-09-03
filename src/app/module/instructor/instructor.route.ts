import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { InstructorController } from "./instructor.controller.js";
import { InstructorValidation } from "./instructor.validation.js";

const router = Router();

// Instructor self routes
router.get("/me", checkAuth("INSTRUCTOR"), InstructorController.getMyInstructorProfile);

router.patch(
  "/me",
  checkAuth("INSTRUCTOR"),
  validateRequest(InstructorValidation.updateInstructorValidationSchema),
  InstructorController.updateMyInstructorProfile,
);

// Admin instructor routes
router.post(
  "/",
  checkAuth("SUPER_ADMIN"),
  validateRequest(InstructorValidation.createInstructorValidationSchema),
  InstructorController.createInstructor,
);

router.get("/", checkAuth("SUPER_ADMIN"), InstructorController.getAllInstructors);

router.get("/:instructorId", checkAuth("SUPER_ADMIN"), InstructorController.getInstructorById);

router.patch(
  "/:instructorId",
  checkAuth("SUPER_ADMIN"),
  validateRequest(InstructorValidation.updateInstructorValidationSchema),
  InstructorController.updateInstructor,
);

export const InstructorRoutes = router;
