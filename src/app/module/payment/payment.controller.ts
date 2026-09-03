import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { PaymentService } from "./payment.service.js";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await PaymentService.initiatePaymentInDB(userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment initiated successfully with bKash",
    data: result,
  });
});

const handleBkashCallback = catchAsync(async (req: Request, res: Response) => {
  const queryParams = {
    paymentID: (req.query.paymentID || req.body.paymentID) as string,
    status: (req.query.status || req.body.status) as string,
    apiVersion: (req.query.apiVersion || req.body.apiVersion) as string,
  };

  const result = await PaymentService.handleBkashCallbackInDB(queryParams);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await PaymentService.getMyPaymentsFromDB(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payments retrieved successfully",
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const role = req.user?.role as string;
  const paymentId = req.params.paymentId as string;

  const result = await PaymentService.getPaymentByIdFromDB(userId, role, paymentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment details retrieved successfully",
    data: result,
  });
});

export const PaymentController = {
  initiatePayment,
  handleBkashCallback,
  getMyPayments,
  getPaymentById,
};
