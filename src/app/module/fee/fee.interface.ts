import type { InvoiceStatus } from "@prisma/client";

export interface ICreateFeeInvoicePayload {
  studentId: string;
  semesterId: string;
  amount: number;
  dueDate: string | Date;
}

export interface IBulkCreateFeeInvoicePayload {
  semesterId: string;
  amount: number;
  dueDate: string | Date;
}

export interface IFeeInvoiceFilterOptions {
  studentId?: string;
  semesterId?: string;
  status?: InvoiceStatus;
}
