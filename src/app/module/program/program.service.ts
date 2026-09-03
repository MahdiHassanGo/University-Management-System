import type { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import {
  calculatePagination,
  createPaginatedResponse,
  type IPaginationOptions,
} from "../../utils/pagination.js";
import type {
  ICreateProgramPayload,
  IProgramFilterOptions,
  IUpdateProgramPayload,
} from "./program.interface.js";

const createProgramInDB = async (payload: ICreateProgramPayload) => {
  const { code, departmentId } = payload;

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department?.isActive) {
    throw new AppError(404, "Department not found or inactive");
  }

  const existingCode = await prisma.program.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (existingCode) {
    throw new AppError(409, "Program code already exists");
  }

  const program = await prisma.program.create({
    data: {
      ...payload,
      code: code.toUpperCase(),
    },
    include: {
      department: true,
    },
  });

  return program;
};

const getAllProgramsFromDB = async (
  filters: IProgramFilterOptions,
  options: IPaginationOptions,
) => {
  const { searchTerm, departmentId, isActive } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const andConditions: Prisma.ProgramWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { code: { contains: searchTerm, mode: "insensitive" } },
        { name: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (departmentId) {
    andConditions.push({ departmentId });
  }

  if (isActive !== undefined) {
    andConditions.push({ isActive });
  }

  const whereConditions: Prisma.ProgramWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [items, total] = await Promise.all([
    prisma.program.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        department: true,
        _count: {
          select: {
            programCourses: true,
            students: true,
          },
        },
      },
    }),
    prisma.program.count({ where: whereConditions }),
  ]);

  return createPaginatedResponse(items, total, page, limit);
};

const getProgramByIdFromDB = async (id: string) => {
  const program = await prisma.program.findFirst({
    where: { OR: [{ id }, { code: id.toUpperCase() }] },
    include: {
      department: true,
      programCourses: {
        include: {
          course: true,
        },
        orderBy: { recommendedSemester: "asc" },
      },
      students: {
        select: {
          id: true,
          studentId: true,
          name: true,
          academicStatus: true,
        },
      },
    },
  });

  if (!program) {
    throw new AppError(404, "Program not found");
  }

  return program;
};

const updateProgramInDB = async (id: string, payload: IUpdateProgramPayload) => {
  const program = await prisma.program.findFirst({
    where: { OR: [{ id }, { code: id.toUpperCase() }] },
  });

  if (!program) {
    throw new AppError(404, "Program not found");
  }

  if (payload.code && payload.code.toUpperCase() !== program.code) {
    const existingCode = await prisma.program.findUnique({
      where: { code: payload.code.toUpperCase() },
    });
    if (existingCode) {
      throw new AppError(409, "Program code already exists");
    }
  }

  if (payload.departmentId && payload.departmentId !== program.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: payload.departmentId },
    });
    if (!department) {
      throw new AppError(404, "Department not found");
    }
  }

  const updatedProgram = await prisma.program.update({
    where: { id: program.id },
    data: {
      ...payload,
      ...(payload.code && { code: payload.code.toUpperCase() }),
    },
    include: {
      department: true,
    },
  });

  return updatedProgram;
};

const deleteProgramFromDB = async (id: string) => {
  const program = await prisma.program.findFirst({
    where: { OR: [{ id }, { code: id.toUpperCase() }] },
    include: {
      _count: {
        select: {
          programCourses: true,
          students: true,
        },
      },
    },
  });

  if (!program) {
    throw new AppError(404, "Program not found");
  }

  if (program._count.programCourses > 0 || program._count.students > 0) {
    const updated = await prisma.program.update({
      where: { id: program.id },
      data: { isActive: false },
    });
    return updated;
  }

  const result = await prisma.program.delete({
    where: { id: program.id },
  });

  return result;
};

export const ProgramService = {
  createProgramInDB,
  getAllProgramsFromDB,
  getProgramByIdFromDB,
  updateProgramInDB,
  deleteProgramFromDB,
};
