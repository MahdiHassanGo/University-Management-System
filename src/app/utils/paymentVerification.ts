import AppError from "./AppError.js";
import type { SslValidation } from "../lib/sslcommerz.js";

export function toMinorUnits(amount: number | string): number {
  const number = Number(amount);
  if (!Number.isFinite(number) || number <= 0 || Math.abs(number * 100 - Math.round(number * 100)) > 0.00001) {
    throw new AppError(400, "Invalid payment amount");
  }
  return Math.round(number * 100);
}
export function verifySslPayment(result: SslValidation, transactionId: string, amount: number) {
  if (!["VALID", "VALIDATED"].includes(result.status) || result.tran_id !== transactionId ||
      result.currency !== "BDT" || !result.bank_tran_id || !result.val_id ||
      String(result.risk_level) !== "0" || toMinorUnits(result.amount ?? 0) !== toMinorUnits(amount)) {
    throw new AppError(400, "Payment could not be verified against the invoice.");
  }
  return result.bank_tran_id;
}
