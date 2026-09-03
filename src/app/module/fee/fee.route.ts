import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import validateRequest from "../../middleware/validateRequest.js";
import { FeeController } from "./fee.controller.js";
import { FeeValidation } from "./fee.validation.js";

const router = Router();

router.get("/invoices/me", checkAuth("STUDENT"), FeeController.getMyInvoices);

router.post(
  "/invoices/bulk",
  checkAuth("SUPER_ADMIN"),
  validateRequest(FeeValidation.bulkCreateFeeInvoiceValidationSchema),
  FeeController.bulkCreateFeeInvoices,
);

router.post(
  "/invoices",
  checkAuth("SUPER_ADMIN"),
  validateRequest(FeeValidation.createFeeInvoiceValidationSchema),
  FeeController.createFeeInvoice,
);

router.get("/invoices", checkAuth("SUPER_ADMIN"), FeeController.getAllInvoices);

export const FeeRoutes = router;
