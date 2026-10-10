import type { Request, Response } from "express";
import config from "../../config/index.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { PaymentService } from "./payment.service.js";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await PaymentService.initiatePaymentInDB(userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Secure checkout initiated",
    data: result,
  });
});

const handleBkashCallback = catchAsync(async (req: Request, res: Response) => {
  const queryParams = {
    paymentID: (req.query?.paymentID || req.body?.paymentID) as string,
    status: (req.query?.status || req.body?.status) as string,
    apiVersion: (req.query?.apiVersion || req.body?.apiVersion) as string,
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

const sslPayload = (req: Request) => ({
  tran_id: typeof req.body?.tran_id === "string" ? req.body.tran_id : undefined,
  val_id: typeof req.body?.val_id === "string" ? req.body.val_id : undefined,
});
const handleSslCallback = catchAsync(async (req: Request, res: Response) => {
  const destination = new URL("/payment/cancel", config.FRONTEND_URL || "http://localhost:3000");
  try {
    const payment = await PaymentService.handleSslCallbackInDB(sslPayload(req));
    destination.pathname = payment.status === "FAILED" || payment.status === "CANCELLED" ? "/payment/cancel" : "/payment/success";
    destination.searchParams.set("paymentId", payment.id);
  } catch {
    destination.searchParams.set("status", "unverified");
  }
  res.redirect(303, destination.toString());
});
const handleSslIpn = catchAsync(async (req: Request, res: Response) => {
  const payment = await PaymentService.handleSslCallbackInDB(sslPayload(req));
  sendResponse(res, { statusCode: 200, success: true, message: "Payment notification verified", data: { paymentId: payment.id, status: payment.status } });
});

export const PaymentController = {
  handleSslCallback,
  handleSslIpn,
  initiatePayment,
  handleBkashCallback,
  getMyPayments,
  getPaymentById,
};
