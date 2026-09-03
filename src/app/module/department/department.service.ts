import type { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import {
  calculatePagination,
  createPaginatedResponse,
  type IPaginationOptions,
} from "../../utils/pagination.js";
import type {
  ICreateDepartmentPayload,
  IDepartmentFilterOptions,
  IUpdateDepartmentPayload,
} from "./department.interface.js";

const createDepartmentInDB = async (payload: ICreateDepartmentPayload) => {
  const { code, name } = payload;

  const existingCode = await prisma.department.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (existingCode) {
    throw new AppError(409, "Department code already exists");
  }

  const existingName = await prisma.department.findUnique({
    where: { name },
  });
  if (existingName) {
    throw new AppError(409, "Department name already exists");
  }

  const department = await prisma.department.create({
    data: {
      ...payload,
      code: code.toUpperCase(),
    },
  });

  return department;
};

const getAllDepartmentsFromDB = async (
  filters: IDepartmentFilterOptions,
  options: IPaginationOptions,
) => {
  const { searchTerm, isActive } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const andConditions: Prisma.DepartmentWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { code: { contains: searchTerm, mode: "insensitive" } },
        { name: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (isActive !== undefined) {
    andConditions.push({ isActive });
  }

  const whereConditions: Prisma.DepartmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [items, total] = await Promise.all([
    prisma.department.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            programs: true,
            courses: true,
            instructors: true,
          },
        },
      },
    }),
    prisma.department.count({ where: whereConditions }),
  ]);

  return createPaginatedResponse(items, total, page, limit);
};

const getDepartmentByIdFromDB = async (id: string) => {
  const department = await prisma.department.findFirst({
    where: { OR: [{ id }, { code: id.toUpperCase() }] },
    include: {
      programs: true,
      courses: true,
      instructors: true,
    },
  });

  if (!department) {
    throw new AppError(404, "Department not found");
  }

  return department;
};

const updateDepartmentInDB = async (id: string, payload: IUpdateDepartmentPayload) => {
  const department = await prisma.department.findFirst({
    where: { OR: [{ id }, { code: id.toUpperCase() }] },
  });

  if (!department) {
    throw new AppError(404, "Department not found");
  }

  if (payload.code && payload.code.toUpperCase() !== department.code) {
    const existingCode = await prisma.department.findUnique({
      where: { code: payload.code.toUpperCase() },
    });
    if (existingCode) {
      throw new AppError(409, "Department code already exists");
    }
  }

  if (payload.name && payload.name !== department.name) {
    const existingName = await prisma.department.findUnique({
      where: { name: payload.name },
    });
    if (existingName) {
      throw new AppError(409, "Department name already exists");
    }
  }

  const updatedDepartment = await prisma.department.update({
    where: { id: department.id },
    data: {
      ...payload,
      ...(payload.code && { code: payload.code.toUpperCase() }),
    },
  });

  return updatedDepartment;
};

const deleteDepartmentFromDB = async (id: string) => {
  const department = await prisma.department.findFirst({
    where: { OR: [{ id }, { code: id.toUpperCase() }] },
    include: {
      _count: {
        select: {
          programs: true,
          courses: true,
          instructors: true,
        },
      },
    },
  });

  if (!department) {
    throw new AppError(404, "Department not found");
  }

  if (
    department._count.programs > 0 ||
    department._count.courses > 0 ||
    department._count.instructors > 0
  ) {
    // Soft delete to preserve foreign key references
    const updated = await prisma.department.update({
      where: { id: department.id },
      data: { isActive: false },
    });
    return updated;
  }

  const result = await prisma.department.delete({
    where: { id: department.id },
  });

  return result;
};

export const DepartmentService = {
  createDepartmentInDB,
  getAllDepartmentsFromDB,
  getDepartmentByIdFromDB,
  updateDepartmentInDB,
  deleteDepartmentFromDB,
};
