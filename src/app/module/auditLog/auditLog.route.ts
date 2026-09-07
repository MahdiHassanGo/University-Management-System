import { Router } from "express";
import checkAuth from "../../middleware/checkAuth.js";
import { AuditLogController } from "./auditLog.controller.js";

const router = Router();

router.get("/", checkAuth("SUPER_ADMIN"), AuditLogController.getAllAuditLogs);

export const AuditLogRoutes = router;
