import type { PaymentStatus, Prisma } from "@prisma/client";
import { BkashService } from "../../lib/bkash.js";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import type { IBkashCallbackQueryParams, IInitiatePaymentPayload } from "./payment.interface.js";

const initiatePaymentInDB = async (userId: string, payload: IInitiatePaymentPayload) => {
  const { invoiceId } = payload;

  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const invoice = await prisma.feeInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      student: true,
      semester: true,
    },
  });

  if (!invoice) {
    throw new AppError(404, "Invoice not found");
  }

  if (invoice.studentId !== student.id) {
    throw new AppError(403, "Forbidden! You can only initiate payment for your own invoices.");
  }

  if (invoice.status === "PAID") {
    throw new AppError(400, "This invoice has already been paid");
  }

  const merchantInvoiceNumber = `MER-${invoice.invoiceNumber}-${Date.now()}`;

  // Call bKash Create Payment API
  const bkashRes = await BkashService.createPayment(
    merchantInvoiceNumber,
    invoice.amount,
    student.studentId,
  );

  // Store payment attempt
  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: invoice.amount,
      gateway: "BKASH",
      merchantInvoiceNumber,
      bkashPaymentID: bkashRes.paymentID,
      status: "PENDING",
      gatewayResponse: bkashRes as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    paymentId: payment.id,
    bkashURL: bkashRes.bkashURL,
    paymentID: bkashRes.paymentID,
    merchantInvoiceNumber,
    amount: invoice.amount,
  };
};

const handleBkashCallbackInDB = async (query: IBkashCallbackQueryParams) => {
  const { paymentID, status } = query;

  if (!paymentID) {
    throw new AppError(400, "paymentID query parameter is required");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ bkashPaymentID: paymentID }, { merchantInvoiceNumber: paymentID }],
    },
    include: {
      invoice: {
        include: {
          student: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, "Payment record not found for this gateway paymentID");
  }

  // Idempotency check: If already marked PAID, return existing status
  if (payment.status === "PAID") {
    return {
      message: "Payment already processed and verified successfully",
      status: "PAID",
      trxID: payment.trxID,
      payment,
    };
  }

  if (status === "cancel" || status === "failure") {
    const updatedStatus: PaymentStatus = status === "cancel" ? "CANCELLED" : "FAILED";
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: updatedStatus,
        gatewayResponse: query as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      message: `Payment ${status} by user`,
      status: updatedStatus,
      payment,
    };
  }

  // Verify and execute server-side with bKash API
  const bkashExecRes = await BkashService.executePayment(payment.bkashPaymentID || paymentID);

  if (bkashExecRes.statusCode !== "0000" && bkashExecRes.transactionStatus !== "Completed") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        gatewayResponse: bkashExecRes as unknown as Prisma.InputJsonValue,
      },
    });
    throw new AppError(400, `Gateway payment verification failed: ${bkashExecRes.statusMessage}`);
  }

  // Transactional update: Mark payment PAID, mark invoice PAID, create notification
  const finalResult = await prisma.$transaction(async (tx) => {
    const trxID = bkashExecRes.trxID || `TRX_${Date.now()}`;

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        trxID,
        gatewayResponse: bkashExecRes as unknown as Prisma.InputJsonValue,
      },
    });

    await tx.feeInvoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: "PAID",
      },
    });

    await tx.notification.create({
      data: {
        recipientId: payment.invoice.student.userId,
        type: "PAYMENT",
        title: "Payment Received",
        message: `Your payment of BDT ${payment.amount} for Invoice #${payment.invoice.invoiceNumber} was successful. Transaction ID: ${trxID}`,
        relatedEntityId: payment.id,
      },
    });

    return updatedPayment;
  });

  return {
    message: "Payment completed and verified successfully",
    status: "PAID",
    trxID: finalResult.trxID,
    payment: finalResult,
  };
};

const getMyPaymentsFromDB = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const payments = await prisma.payment.findMany({
    where: {
      invoice: {
        studentId: student.id,
      },
    },
    include: {
      invoice: {
        include: {
          semester: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return payments;
};

const getPaymentByIdFromDB = async (userId: string, role: string, paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          student: true,
          semester: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, "Payment record not found");
  }

  if (role === "STUDENT" && payment.invoice.student.userId !== userId) {
    throw new AppError(403, "Forbidden! You can only view your own payment details.");
  }

  return payment;
};

export const PaymentService = {
  initiatePaymentInDB,
  handleBkashCallbackInDB,
  getMyPaymentsFromDB,
  getPaymentByIdFromDB,
};
