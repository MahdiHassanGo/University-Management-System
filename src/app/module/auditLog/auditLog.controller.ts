import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { AuditLogService } from "./auditLog.service.js";

const getAllAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    actorId: req.query.actorId as string,
    action: req.query.action as string,
    entityType: req.query.entityType as string,
  };

  const options = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sortBy: (req.query.sortBy as string) || "createdAt",
    sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
  };

  const result = await AuditLogService.getAllAuditLogsFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Audit logs retrieved successfully",
    data: result,
  });
});

export const AuditLogController = {
  getAllAuditLogs,
};
