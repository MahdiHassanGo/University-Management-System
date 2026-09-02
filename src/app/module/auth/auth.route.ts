import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { AuthController } from "./auth.controller.js";
import { AuthValidation } from "./auth.validation.js";

const router = Router();

router.post(
  "/register",
  validateRequest(AuthValidation.registerStudentValidationSchema),
  AuthController.registerStudent,
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginUserValidationSchema),
  AuthController.loginUser,
);

router.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshTokenValidationSchema),
  AuthController.refreshToken,
);

router.post("/logout", AuthController.logoutUser);

router.post(
  "/google",
  validateRequest(AuthValidation.googleLoginValidationSchema),
  AuthController.googleLogin,
);

router.get("/me", checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"), AuthController.getMe);

router.post(
  "/change-password",
  checkAuth("SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword,
);

export const AuthRoutes = router;
