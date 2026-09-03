import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { CourseController } from "./course.controller.js";
import { CourseValidation } from "./course.validation.js";

const router = Router();

// Courses CRUD
router.get("/", checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"), CourseController.getAllCourses);

router.get(
  "/:id",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  CourseController.getCourseById,
);

router.post(
  "/",
  checkAuth("SUPER_ADMIN"),
  validateRequest(CourseValidation.createCourseValidationSchema),
  CourseController.createCourse,
);

router.patch(
  "/:id",
  checkAuth("SUPER_ADMIN"),
  validateRequest(CourseValidation.updateCourseValidationSchema),
  CourseController.updateCourse,
);

router.delete("/:id", checkAuth("SUPER_ADMIN"), CourseController.deleteCourse);

// Course Prerequisites
router.get(
  "/:courseId/prerequisites",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  CourseController.getCoursePrerequisites,
);

router.post(
  "/:courseId/prerequisites",
  checkAuth("SUPER_ADMIN"),
  validateRequest(CourseValidation.addPrerequisiteValidationSchema),
  CourseController.addPrerequisiteToCourse,
);

router.delete(
  "/:courseId/prerequisites/:prerequisiteId",
  checkAuth("SUPER_ADMIN"),
  CourseController.removePrerequisiteFromCourse,
);

export const CourseRoutes = router;
