import type { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import {
  calculatePagination,
  createPaginatedResponse,
  type IPaginationOptions,
} from "../../utils/pagination.js";
import type {
  IBulkCreateFeeInvoicePayload,
  ICreateFeeInvoicePayload,
  IFeeInvoiceFilterOptions,
} from "./fee.interface.js";

const generateInvoiceNumber = async (): Promise<string> => {
  const count = await prisma.feeInvoice.count();
  const year = new Date().getFullYear();
  return `INV${year}${String(count + 1).padStart(5, "0")}`;
};

const createFeeInvoiceInDB = async (payload: ICreateFeeInvoicePayload) => {
  const { studentId, semesterId, amount, dueDate } = payload;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const semester = await prisma.academicSemester.findUnique({ where: { id: semesterId } });
  if (!semester) {
    throw new AppError(404, "Academic semester not found");
  }

  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await prisma.feeInvoice.create({
    data: {
      invoiceNumber,
      studentId,
      semesterId,
      amount,
      dueDate: new Date(dueDate),
      status: "UNPAID",
    },
    include: {
      student: true,
      semester: true,
    },
  });

  return invoice;
};

const bulkCreateFeeInvoicesInDB = async (payload: IBulkCreateFeeInvoicePayload) => {
  const { semesterId, amount, dueDate } = payload;

  const semester = await prisma.academicSemester.findUnique({ where: { id: semesterId } });
  if (!semester) {
    throw new AppError(404, "Academic semester not found");
  }

  const students = await prisma.student.findMany({
    where: { academicStatus: "ACTIVE" },
  });

  if (students.length === 0) {
    throw new AppError(400, "No active students found to create invoices");
  }

  const createdInvoices = await prisma.$transaction(async (tx) => {
    const list = [];
    const baseCount = await tx.feeInvoice.count();
    const year = new Date().getFullYear();

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const invoiceNumber = `INV${year}${String(baseCount + i + 1).padStart(5, "0")}`;

      const inv = await tx.feeInvoice.create({
        data: {
          invoiceNumber,
          studentId: student.id,
          semesterId,
          amount,
          dueDate: new Date(dueDate),
          status: "UNPAID",
        },
      });
      list.push(inv);
    }
    return list;
  });

  return createdInvoices;
};

const getMyInvoicesFromDB = async (userId: string) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const invoices = await prisma.feeInvoice.findMany({
    where: { studentId: student.id },
    include: {
      semester: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices;
};

const getAllInvoicesFromDB = async (
  filters: IFeeInvoiceFilterOptions,
  options: IPaginationOptions,
) => {
  const { studentId, semesterId, status } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const andConditions: Prisma.FeeInvoiceWhereInput[] = [];

  if (studentId) {
    andConditions.push({ studentId });
  }

  if (semesterId) {
    andConditions.push({ semesterId });
  }

  if (status) {
    andConditions.push({ status });
  }

  const whereConditions: Prisma.FeeInvoiceWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [items, total] = await Promise.all([
    prisma.feeInvoice.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        student: {
          include: {
            user: { select: { email: true } },
          },
        },
        semester: true,
        payments: true,
      },
    }),
    prisma.feeInvoice.count({ where: whereConditions }),
  ]);

  return createPaginatedResponse(items, total, page, limit);
};

export const FeeService = {
  createFeeInvoiceInDB,
  bulkCreateFeeInvoicesInDB,
  getMyInvoicesFromDB,
  getAllInvoicesFromDB,
};
