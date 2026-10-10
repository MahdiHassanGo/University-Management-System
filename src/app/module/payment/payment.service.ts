import { randomUUID } from "node:crypto";
import type { Payment, Prisma } from "@prisma/client";
import { BkashService } from "../../lib/bkash.js";
import prisma from "../../lib/prisma.js";
import { getSslConfig, SslCommerzService, type SslValidation } from "../../lib/sslcommerz.js";
import AppError from "../../utils/AppError.js";
import { toMinorUnits, verifySslPayment } from "../../utils/paymentVerification.js";
import type { IBkashCallbackQueryParams, IInitiatePaymentPayload } from "./payment.interface.js";

function sessionData(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return {
    gatewayUrl: typeof value.gatewayUrl === "string" ? value.gatewayUrl : undefined,
    sessionKey: typeof value.sessionKey === "string" ? value.sessionKey : undefined,
  };
}
const publicPayment = <T extends Payment>(payment: T) => {
  const { gatewayResponse: _response, bkashPaymentID: _gatewayId, ...receipt } = payment;
  return receipt;
};
const initiatePaymentInDB = async (userId: string, payload: IInitiatePaymentPayload) => {
  getSslConfig();
  // Serialize on the invoice row so double-clicks and concurrent requests cannot create two live checkouts.
  const reserved = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM fee_invoices WHERE id = ${payload.invoiceId} FOR UPDATE`;
    const invoice = await tx.feeInvoice.findUnique({ where: { id: payload.invoiceId }, include: { student: { include: { user: true } } } });
    if (!invoice) throw new AppError(404, "Invoice not found");
    if (invoice.student.userId !== userId) throw new AppError(403, "You can only pay your own invoices.");
    if (!["UNPAID", "OVERDUE"].includes(invoice.status)) throw new AppError(409, "This invoice is not payable.");
    toMinorUnits(invoice.amount);
    const pending = await tx.payment.findFirst({ where: { invoiceId: invoice.id, status: "PENDING" }, orderBy: { createdAt: "desc" } });
    if (pending) {
      // Do not discard a pending checkout on a timer: reconcile its provider status first.
      const session = sessionData(pending.gatewayResponse);
      if (session.gatewayUrl && pending.gateway === "SSLCOMMERZ") return { payment: pending, invoice, reused: true };
      throw new AppError(409, "A payment is already being prepared or awaiting confirmation. Please check your payment history.");
    }
    const payment = await tx.payment.create({ data: {
      invoiceId: invoice.id, amount: invoice.amount, gateway: "SSLCOMMERZ", status: "PENDING",
      merchantInvoiceNumber: `UMS${randomUUID().replaceAll("-", "").slice(0, 24)}`,
    } });
    return { payment, invoice, reused: false };
  });
  const { payment, invoice } = reserved;
  let session = sessionData(payment.gatewayResponse);
  if (!reserved.reused) {
    try {
      session = await SslCommerzService.createSession({ transactionId: payment.merchantInvoiceNumber, amount: payment.amount,
        name: invoice.student.name, email: invoice.student.user.email, phone: invoice.student.contactNo ?? undefined, frontendUrl: payload.frontendUrl });
      await prisma.payment.update({ where: { id: payment.id }, data: { gatewayResponse: session } });
    } catch (error) {
      // No valid hosted checkout was returned; retain a failed attempt instead of fabricating success.
      await prisma.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED" } });
      throw error;
    }
  }
  return { paymentId: payment.id, gatewayUrl: session.gatewayUrl, merchantInvoiceNumber: payment.merchantInvoiceNumber, amount: payment.amount };
};

async function settlePayment(payment: Payment, trxID: string, verification: Prisma.InputJsonValue) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM fee_invoices WHERE id = ${payment.invoiceId} FOR UPDATE`;
    const current = await tx.payment.findUnique({ where: { id: payment.id } });
    if (!current) throw new AppError(404, "Payment not found");
    if (current.status === "PAID") return current;
    const invoice = await tx.feeInvoice.findUnique({ where: { id: payment.invoiceId }, include: { student: true } });
    if (!invoice) throw new AppError(404, "Invoice not found");
    if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
      throw new AppError(409, "This invoice is already settled or cancelled. Please contact finance to reconcile the transaction.");
    }
    if (toMinorUnits(current.amount) !== toMinorUnits(invoice.amount)) throw new AppError(409, "Invoice amount has changed. Please contact finance.");
    const updated = await tx.payment.update({ where: { id: payment.id }, data: { status: "PAID", trxID, gatewayResponse: verification } });
    await tx.feeInvoice.update({ where: { id: invoice.id }, data: { status: "PAID" } });
    await tx.notification.create({ data: { recipientId: invoice.student.userId, type: "PAYMENT", title: "Payment received",
      message: `Your payment of BDT ${payment.amount.toFixed(2)} for ${invoice.invoiceNumber} was confirmed. Transaction: ${trxID}`, relatedEntityId: payment.id } });
    return updated;
  });
}
async function processSslResult(payment: Payment, result: SslValidation) {
  if (["VALID", "VALIDATED"].includes(result.status)) {
    const trxID = verifySslPayment(result, payment.merchantInvoiceNumber, payment.amount);
    // Store only the verified receipt fields, not card details or customer data.
    return settlePayment(payment, trxID, { status: result.status, tran_id: result.tran_id!, val_id: result.val_id!, bank_tran_id: trxID, amount: result.amount!, currency: result.currency! });
  }
  if (result.tran_id === payment.merchantInvoiceNumber && ["FAILED", "CANCELLED"].includes(result.status)) {
    await prisma.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: result.status === "FAILED" ? "FAILED" : "CANCELLED" } });
  }
  return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
}
const handleSslCallbackInDB = async (payload: { tran_id?: string; val_id?: string }) => {
  if (!payload.tran_id) throw new AppError(400, "Transaction reference is required.");
  const payment = await prisma.payment.findUnique({ where: { merchantInvoiceNumber: payload.tran_id } });
  if (!payment || payment.gateway !== "SSLCOMMERZ") throw new AppError(404, "Payment not found");
  if (payment.status === "PAID") return publicPayment(payment);
  const session = sessionData(payment.gatewayResponse);
  if (!payload.val_id && !session.sessionKey) throw new AppError(400, "Payment verification reference is missing.");
  const verification = payload.val_id ? await SslCommerzService.validate(payload.val_id) : await SslCommerzService.querySession(session.sessionKey!);
  return publicPayment(await processSslResult(payment, verification));
};

// Legacy callback remains for existing bKash attempts. New checkouts use SSLCommerz.
const handleBkashCallbackInDB = async (query: IBkashCallbackQueryParams) => {
  if (!query.paymentID) throw new AppError(400, "paymentID is required");
  const payment = await prisma.payment.findFirst({ where: { bkashPaymentID: query.paymentID, gateway: "BKASH" } });
  if (!payment) throw new AppError(404, "Payment not found");
  if (payment.status === "PAID") return { message: "Payment already verified", status: "PAID", payment: publicPayment(payment) };
  // Browser callback status is never accepted as proof of success, cancellation, or failure.
  let verification = await BkashService.queryPayment(query.paymentID);
  if(verification.transactionStatus!=="Completed" && query.status==="success"){
    try { verification=await BkashService.executePayment(query.paymentID); } catch { verification=await BkashService.queryPayment(query.paymentID); }
    if(verification.transactionStatus!=="Completed") verification=await BkashService.queryPayment(query.paymentID);
  }
  if (verification.transactionStatus !== "Completed" || verification.statusCode !== "0000" ||
    verification.paymentID !== payment.bkashPaymentID || verification.merchantInvoiceNumber !== payment.merchantInvoiceNumber ||
    verification.currency !== "BDT" || !verification.trxID || toMinorUnits(verification.amount) !== toMinorUnits(payment.amount)) {
    throw new AppError(400, "Gateway has not confirmed a completed payment.");
  }
  const receipt = await settlePayment(payment, verification.trxID, { trxID: verification.trxID, amount: verification.amount, transactionStatus: verification.transactionStatus });
  return { message: "Payment verified", status: "PAID", payment: publicPayment(receipt) };
};
const getMyPaymentsFromDB = async (userId: string) => {
  const payments = await prisma.payment.findMany({ where: { invoice: { student: { userId } } }, include: { invoice: { include: { semester: true } } }, orderBy: { createdAt: "desc" } });
  return payments.map(publicPayment);
};
const getPaymentByIdFromDB = async (userId: string, role: string, paymentId: string) => {
  let payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { invoice: { include: { student: true, semester: true } } } });
  if (!payment) throw new AppError(404, "Payment not found");
  if (role !== "SUPER_ADMIN" && payment.invoice.student.userId !== userId) throw new AppError(403, "You can only view your own payments.");
  // Recover a lost browser callback using the provider session, after enforcing ownership.
  if (payment.gateway === "SSLCOMMERZ" && payment.status === "PENDING") {
    const session = sessionData(payment.gatewayResponse);
    if (session.sessionKey) {
      await processSslResult(payment, await SslCommerzService.querySession(session.sessionKey));
      payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { invoice: { include: { student: true, semester: true } } } });
    }
  }
  return publicPayment(payment);
};
export const PaymentService = { initiatePaymentInDB, handleSslCallbackInDB, handleBkashCallbackInDB, getMyPaymentsFromDB, getPaymentByIdFromDB };
