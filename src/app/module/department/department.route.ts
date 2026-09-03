import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { DepartmentController } from "./department.controller.js";
import { DepartmentValidation } from "./department.validation.js";

const router = Router();

router.get(
  "/",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  DepartmentController.getAllDepartments,
);

router.get(
  "/:id",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  DepartmentController.getDepartmentById,
);

router.post(
  "/",
  checkAuth("SUPER_ADMIN"),
  validateRequest(DepartmentValidation.createDepartmentValidationSchema),
  DepartmentController.createDepartment,
);

router.patch(
  "/:id",
  checkAuth("SUPER_ADMIN"),
  validateRequest(DepartmentValidation.updateDepartmentValidationSchema),
  DepartmentController.updateDepartment,
);

router.delete("/:id", checkAuth("SUPER_ADMIN"), DepartmentController.deleteDepartment);

export const DepartmentRoutes = router;
