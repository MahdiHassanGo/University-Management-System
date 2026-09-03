import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { PaymentController } from "./payment.controller.js";
import { PaymentValidation } from "./payment.validation.js";

const router = Router();

// Public callback routes for bKash
router.get("/bkash/callback", PaymentController.handleBkashCallback);
router.post("/bkash/callback", PaymentController.handleBkashCallback);

// Student payment routes
router.post(
  "/initiate",
  checkAuth("STUDENT"),
  validateRequest(PaymentValidation.initiatePaymentValidationSchema),
  PaymentController.initiatePayment,
);

router.get("/me", checkAuth("STUDENT"), PaymentController.getMyPayments);

router.get("/:paymentId", checkAuth("STUDENT", "SUPER_ADMIN"), PaymentController.getPaymentById);

export const PaymentRoutes = router;
