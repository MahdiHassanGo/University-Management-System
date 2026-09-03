import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { StudentController } from "./student.controller.js";
import { StudentValidation } from "./student.validation.js";

const router = Router();

// Student self routes
router.get("/me", checkAuth("STUDENT"), StudentController.getMyStudentProfile);

router.patch(
  "/me",
  checkAuth("STUDENT"),
  validateRequest(StudentValidation.updateStudentValidationSchema),
  StudentController.updateMyStudentProfile,
);

// Admin student routes
router.post(
  "/",
  checkAuth("SUPER_ADMIN"),
  validateRequest(StudentValidation.createStudentValidationSchema),
  StudentController.createStudent,
);

router.get("/", checkAuth("SUPER_ADMIN"), StudentController.getAllStudents);

router.get("/:studentId", checkAuth("SUPER_ADMIN"), StudentController.getStudentById);

router.patch(
  "/:studentId",
  checkAuth("SUPER_ADMIN"),
  validateRequest(StudentValidation.updateStudentValidationSchema),
  StudentController.updateStudent,
);

export const StudentRoutes = router;
