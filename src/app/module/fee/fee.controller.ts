import type { InvoiceStatus } from "@prisma/client";
import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { FeeService } from "./fee.service.js";

const createFeeInvoice = catchAsync(async (req: Request, res: Response) => {
  const result = await FeeService.createFeeInvoiceInDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Fee invoice created successfully",
    data: result,
  });
});

const bulkCreateFeeInvoices = catchAsync(async (req: Request, res: Response) => {
  const result = await FeeService.bulkCreateFeeInvoicesInDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Fee invoices created in bulk successfully",
    data: result,
  });
});

const getMyInvoices = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await FeeService.getMyInvoicesFromDB(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Fee invoices retrieved successfully",
    data: result,
  });
});

const getAllInvoices = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    studentId: req.query.studentId as string,
    semesterId: req.query.semesterId as string,
    status: req.query.status as InvoiceStatus,
  };

  const options = {
    page: req.query.page as string,
    limit: req.query.limit as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await FeeService.getAllInvoicesFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Fee invoices retrieved successfully",
    data: result,
  });
});

export const FeeController = {
  createFeeInvoice,
  bulkCreateFeeInvoices,
  getMyInvoices,
  getAllInvoices,
};
