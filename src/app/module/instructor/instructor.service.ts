import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import config from "../../config/index.js";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import {
  calculatePagination,
  createPaginatedResponse,
  type IPaginationOptions,
} from "../../utils/pagination.js";
import type {
  ICreateInstructorPayload,
  IInstructorFilterOptions,
  IUpdateInstructorPayload,
} from "./instructor.interface.js";

const createInstructorInDB = async (payload: ICreateInstructorPayload) => {
  const { email, password, name, designation, departmentId, contactNo } = payload;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError(409, "User with this email already exists");
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department?.isActive) {
    throw new AppError(404, "Department is invalid or inactive");
  }

  const hashedPassword = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "INSTRUCTOR",
        status: "ACTIVE",
        provider: "CREDENTIALS",
      },
    });

    const instructorCount = await tx.instructor.count();
    const employeeId = `EMP${String(instructorCount + 1).padStart(4, "0")}`;

    const instructorProfile = await tx.instructor.create({
      data: {
        employeeId,
        userId: user.id,
        name,
        designation,
        departmentId,
        contactNo,
        academicStatus: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            provider: true,
            createdAt: true,
          },
        },
        department: true,
      },
    });

    return instructorProfile;
  });

  return result;
};

const getAllInstructorsFromDB = async (
  filters: IInstructorFilterOptions,
  options: IPaginationOptions,
) => {
  const { searchTerm, departmentId, academicStatus } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const andConditions: Prisma.InstructorWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { employeeId: { contains: searchTerm, mode: "insensitive" } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  if (departmentId) {
    andConditions.push({ departmentId });
  }

  if (academicStatus) {
    andConditions.push({ academicStatus });
  }

  const whereConditions: Prisma.InstructorWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [items, total] = await Promise.all([
    prisma.instructor.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            provider: true,
            createdAt: true,
          },
        },
        department: true,
      },
    }),
    prisma.instructor.count({ where: whereConditions }),
  ]);

  return createPaginatedResponse(items, total, page, limit);
};

const getInstructorByIdFromDB = async (id: string) => {
  const instructor = await prisma.instructor.findFirst({
    where: { OR: [{ id }, { employeeId: id }] },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          provider: true,
          createdAt: true,
        },
      },
      department: true,
    },
  });

  if (!instructor) {
    throw new AppError(404, "Instructor profile not found");
  }

  return instructor;
};

const getMyInstructorProfileFromDB = async (userId: string) => {
  const instructor = await prisma.instructor.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          provider: true,
          createdAt: true,
        },
      },
      department: true,
    },
  });

  if (!instructor) {
    throw new AppError(404, "Instructor profile not found");
  }

  return instructor;
};

const updateMyInstructorProfileInDB = async (userId: string, payload: IUpdateInstructorPayload) => {
  const instructor = await prisma.instructor.findUnique({
    where: { userId },
  });

  if (!instructor) {
    throw new AppError(404, "Instructor profile not found");
  }

  const { name, designation, contactNo } = payload;

  const updatedInstructor = await prisma.instructor.update({
    where: { userId },
    data: {
      ...(name && { name }),
      ...(designation && { designation }),
      ...(contactNo !== undefined && { contactNo }),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      },
      department: true,
    },
  });

  return updatedInstructor;
};

const updateInstructorInDB = async (id: string, payload: IUpdateInstructorPayload) => {
  const instructor = await prisma.instructor.findFirst({
    where: { OR: [{ id }, { employeeId: id }] },
  });

  if (!instructor) {
    throw new AppError(404, "Instructor profile not found");
  }

  if (payload.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: payload.departmentId },
    });
    if (!department) {
      throw new AppError(404, "Department not found");
    }
  }

  const updatedInstructor = await prisma.instructor.update({
    where: { id: instructor.id },
    data: payload,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      },
      department: true,
    },
  });

  return updatedInstructor;
};

export const InstructorService = {
  createInstructorInDB,
  getAllInstructorsFromDB,
  getInstructorByIdFromDB,
  getMyInstructorProfileFromDB,
  updateMyInstructorProfileInDB,
  updateInstructorInDB,
};
