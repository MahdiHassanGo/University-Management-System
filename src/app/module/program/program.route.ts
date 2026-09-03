import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { CourseController } from "../course/course.controller.js";
import { CourseValidation } from "../course/course.validation.js";
import { ProgramController } from "./program.controller.js";
import { ProgramValidation } from "./program.validation.js";

const router = Router();

router.get(
  "/",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  ProgramController.getAllPrograms,
);

router.get(
  "/:id",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  ProgramController.getProgramById,
);

router.post(
  "/",
  checkAuth("SUPER_ADMIN"),
  validateRequest(ProgramValidation.createProgramValidationSchema),
  ProgramController.createProgram,
);

router.patch(
  "/:id",
  checkAuth("SUPER_ADMIN"),
  validateRequest(ProgramValidation.updateProgramValidationSchema),
  ProgramController.updateProgram,
);

router.delete("/:id", checkAuth("SUPER_ADMIN"), ProgramController.deleteProgram);

// Program Curriculum endpoints
router.post(
  "/:programId/courses",
  checkAuth("SUPER_ADMIN"),
  validateRequest(CourseValidation.addProgramCourseValidationSchema),
  CourseController.addCourseToProgramCurriculum,
);

router.delete(
  "/:programId/courses/:courseId",
  checkAuth("SUPER_ADMIN"),
  CourseController.removeCourseFromProgramCurriculum,
);

export const ProgramRoutes = router;
