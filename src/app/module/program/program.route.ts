import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
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

export const ProgramRoutes = router;
