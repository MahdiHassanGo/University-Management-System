import { beforeEach, describe, expect, it, vi } from "vitest";
import { toMinorUnits, verifySslPayment } from "../../src/app/utils/paymentVerification.js";

const mocks = vi.hoisted(() => ({
  db: {
    $queryRaw: vi.fn(), $transaction: vi.fn(),
    feeInvoice: { findUnique: vi.fn(), update: vi.fn() },
    payment: { findFirst: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findMany: vi.fn() },
    notification: { create: vi.fn() },
  },
  gateway: { createSession: vi.fn(), validate: vi.fn(), querySession: vi.fn() },
}));
vi.mock("../../src/app/lib/prisma.js", () => ({ default: mocks.db }));
vi.mock("../../src/app/config/index.js", () => ({ default: { SSLCOMMERZ_STORE_ID: "test-store", SSLCOMMERZ_STORE_PASS: "test-password", FRONTEND_URL: "https://frontend.example", BACKEND_URL: "https://backend.example" } }));
vi.mock("../../src/app/lib/sslcommerz.js", () => ({ getSslConfig: vi.fn(), SslCommerzService: mocks.gateway }));
import { PaymentService } from "../../src/app/module/payment/payment.service.js";

const invoice = () => ({ id: "invoice", studentId: "student", invoiceNumber: "INV-1", amount: 100.25, status: "UNPAID", student: { id: "student", userId: "owner", name: "Student", user: { email: "student@example.com" } } });
const attempt = () => ({ id: "payment", invoiceId: "invoice", amount: 100.25, gateway: "SSLCOMMERZ", merchantInvoiceNumber: "UMS-test", status: "PENDING", trxID: null, bkashPaymentID: null, gatewayResponse: { gatewayUrl: "https://sandbox.sslcommerz.com/checkout", sessionKey: "session" }, createdAt: new Date(), updatedAt: new Date() });
const verified = () => ({ status: "VALID", tran_id: "UMS-test", val_id: "valid-ref", amount: "100.25", currency: "BDT", bank_tran_id: "bank-ref", risk_level: "0" });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.db.$transaction.mockImplementation(callback => callback(mocks.db));
  mocks.db.feeInvoice.findUnique.mockResolvedValue(invoice());
  mocks.db.payment.findUnique.mockResolvedValue(attempt());
  mocks.db.payment.findFirst.mockResolvedValue(null);
  mocks.db.payment.create.mockResolvedValue({ ...attempt(), gatewayResponse: null });
  mocks.db.payment.update.mockResolvedValue({ ...attempt(), status: "PAID", trxID: "bank-ref" });
  mocks.db.payment.findUniqueOrThrow.mockResolvedValue(attempt());
  mocks.gateway.createSession.mockResolvedValue({ gatewayUrl: "https://sandbox.sslcommerz.com/checkout", sessionKey: "session" });
  mocks.gateway.validate.mockResolvedValue(verified());
});

describe("Payment verification", () => {
  it("compares decimal amounts in minor units", () => expect(toMinorUnits("100.25")).toBe(10025));
  it.each([0, -1, NaN, Infinity, 10.001])("rejects invalid amounts: %s", amount => expect(() => toMinorUnits(amount)).toThrow());
  it.each([
    { status: "FAILED" }, { status: "PENDING" }, { tran_id: "another-invoice" }, { amount: "1.00" },
    { currency: "USD" }, { bank_tran_id: "" }, { val_id: "" }, { risk_level: "1" },
  ])("rejects a mismatched or unconfirmed gateway response: %j", override => {
    expect(() => verifySslPayment({ ...verified(), ...override }, "UMS-test", 100.25)).toThrow();
  });
  it("accepts an authenticated revalidated transaction", () => {
    expect(verifySslPayment({ ...verified(), status: "VALIDATED" }, "UMS-test", 100.25)).toBe("bank-ref");
  });
});

describe("Checkout and callbacks", () => {
  it("rejects another student's invoice before contacting the provider", async () => {
    await expect(PaymentService.initiatePaymentInDB("stranger", { invoiceId: "invoice" })).rejects.toThrow("own invoices");
    expect(mocks.gateway.createSession).not.toHaveBeenCalled();
  });
  it.each(["PAID", "CANCELLED"])("rejects a %s invoice", async status => {
    mocks.db.feeInvoice.findUnique.mockResolvedValue({ ...invoice(), status });
    await expect(PaymentService.initiatePaymentInDB("owner", { invoiceId: "invoice" })).rejects.toThrow("not payable");
  });
  it("uses the invoice amount and creates a database attempt before checkout", async () => {
    const result = await PaymentService.initiatePaymentInDB("owner", { invoiceId: "invoice" });
    expect(mocks.gateway.createSession).toHaveBeenCalledWith(expect.objectContaining({ amount: 100.25 }));
    expect(mocks.db.payment.create).toHaveBeenCalledOnce();
    expect(result.gatewayUrl).toBe("https://sandbox.sslcommerz.com/checkout");
  });
  it("reuses an existing pending checkout without charging twice", async () => {
    mocks.db.payment.findFirst.mockResolvedValue(attempt());
    await PaymentService.initiatePaymentInDB("owner", { invoiceId: "invoice" });
    expect(mocks.db.payment.create).not.toHaveBeenCalled();
    expect(mocks.gateway.createSession).not.toHaveBeenCalled();
  });
  it("reports provider failure and never fabricates a success URL", async () => {
    mocks.gateway.createSession.mockRejectedValue(new Error("Provider unavailable"));
    await expect(PaymentService.initiatePaymentInDB("owner", { invoiceId: "invoice" })).rejects.toThrow("Provider unavailable");
    expect(mocks.db.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "FAILED" } }));
    expect(mocks.db.feeInvoice.update).not.toHaveBeenCalled();
  });
  it("rejects forged callback amount without marking the invoice paid", async () => {
    mocks.gateway.validate.mockResolvedValue({ ...verified(), amount: "1.00" });
    await expect(PaymentService.handleSslCallbackInDB({ tran_id: "UMS-test", val_id: "valid-ref" })).rejects.toThrow("verified");
    expect(mocks.db.feeInvoice.update).not.toHaveBeenCalled();
  });
  it("settles payment, invoice, and notification in the same transaction", async () => {
    const result = await PaymentService.handleSslCallbackInDB({ tran_id: "UMS-test", val_id: "valid-ref" });
    expect(result.status).toBe("PAID");
    expect(result).not.toHaveProperty("gatewayResponse");
    expect(mocks.db.feeInvoice.update).toHaveBeenCalledWith({ where: { id: "invoice" }, data: { status: "PAID" } });
    expect(mocks.db.notification.create).toHaveBeenCalledOnce();
  });
  it("does not settle or notify again for a duplicate callback", async () => {
    mocks.db.payment.findUnique.mockResolvedValue({ ...attempt(), status: "PAID", trxID: "bank-ref" });
    await PaymentService.handleSslCallbackInDB({ tran_id: "UMS-test", val_id: "valid-ref" });
    expect(mocks.gateway.validate).not.toHaveBeenCalled();
    expect(mocks.db.notification.create).not.toHaveBeenCalled();
  });
  it("does not trust a cancellation redirect as provider confirmation", async () => {
    mocks.gateway.querySession.mockResolvedValue({ status: "UNATTEMPTED", tran_id: "UMS-test" });
    const result = await PaymentService.handleSslCallbackInDB({ tran_id: "UMS-test" });
    expect(result.status).toBe("PENDING");
    expect(mocks.db.payment.updateMany).not.toHaveBeenCalled();
  });
  it("checks receipt ownership before attempting payment reconciliation", async () => {
    mocks.db.payment.findUnique.mockResolvedValue({ ...attempt(), invoice: invoice() });
    await expect(PaymentService.getPaymentByIdFromDB("stranger", "STUDENT", "payment")).rejects.toThrow("own payments");
    expect(mocks.gateway.querySession).not.toHaveBeenCalled();
  });
});
