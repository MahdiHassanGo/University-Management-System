import type { Prisma, SemesterStatus } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import {
  calculatePagination,
  createPaginatedResponse,
  type IPaginationOptions,
} from "../../utils/pagination.js";
import type {
  ICreateSemesterPayload,
  ISemesterFilterOptions,
  IUpdateSemesterPayload,
} from "./semester.interface.js";

const createSemesterInDB = async (payload: ICreateSemesterPayload) => {
  const { year, term } = payload;

  const existingSemester = await prisma.academicSemester.findUnique({
    where: {
      year_term: {
        year,
        term,
      },
    },
  });

  if (existingSemester) {
    throw new AppError(409, `Academic semester ${term} ${year} already exists`);
  }

  const semester = await prisma.academicSemester.create({
    data: {
      ...payload,
      registrationStart: new Date(payload.registrationStart),
      registrationEnd: new Date(payload.registrationEnd),
      classStart: new Date(payload.classStart),
      classEnd: new Date(payload.classEnd),
      resultDate: payload.resultDate ? new Date(payload.resultDate) : null,
    },
  });

  return semester;
};

const getAllSemestersFromDB = async (
  filters: ISemesterFilterOptions,
  options: IPaginationOptions,
) => {
  const { year, term, status } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const andConditions: Prisma.AcademicSemesterWhereInput[] = [];

  if (year) {
    andConditions.push({ year: Number(year) });
  }

  if (term) {
    andConditions.push({ term });
  }

  if (status) {
    andConditions.push({ status });
  }

  const whereConditions: Prisma.AcademicSemesterWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [items, total] = await Promise.all([
    prisma.academicSemester.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            sections: true,
            students: true,
            invoices: true,
          },
        },
      },
    }),
    prisma.academicSemester.count({ where: whereConditions }),
  ]);

  return createPaginatedResponse(items, total, page, limit);
};

const getSemesterByIdFromDB = async (id: string) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id },
    include: {
      sections: {
        include: {
          course: true,
          instructor: true,
        },
      },
      _count: {
        select: {
          students: true,
          invoices: true,
        },
      },
    },
  });

  if (!semester) {
    throw new AppError(404, "Academic semester not found");
  }

  return semester;
};

const updateSemesterInDB = async (id: string, payload: IUpdateSemesterPayload) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id },
  });

  if (!semester) {
    throw new AppError(404, "Academic semester not found");
  }

  if (payload.year && payload.term) {
    const existing = await prisma.academicSemester.findUnique({
      where: {
        year_term: {
          year: payload.year,
          term: payload.term,
        },
      },
    });

    if (existing && existing.id !== id) {
      throw new AppError(409, `Academic semester ${payload.term} ${payload.year} already exists`);
    }
  }

  const updatedSemester = await prisma.academicSemester.update({
    where: { id },
    data: {
      ...payload,
      ...(payload.registrationStart && {
        registrationStart: new Date(payload.registrationStart),
      }),
      ...(payload.registrationEnd && {
        registrationEnd: new Date(payload.registrationEnd),
      }),
      ...(payload.classStart && { classStart: new Date(payload.classStart) }),
      ...(payload.classEnd && { classEnd: new Date(payload.classEnd) }),
      ...(payload.resultDate && { resultDate: new Date(payload.resultDate) }),
    },
  });

  return updatedSemester;
};

const updateSemesterStatusInDB = async (id: string, status: SemesterStatus) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id },
  });

  if (!semester) {
    throw new AppError(404, "Academic semester not found");
  }

  const updatedSemester = await prisma.academicSemester.update({
    where: { id },
    data: { status },
  });

  return updatedSemester;
};

export const SemesterService = {
  createSemesterInDB,
  getAllSemestersFromDB,
  getSemesterByIdFromDB,
  updateSemesterInDB,
  updateSemesterStatusInDB,
};
