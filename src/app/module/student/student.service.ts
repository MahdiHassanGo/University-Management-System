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
  ICreateStudentPayload,
  IStudentFilterOptions,
  IUpdateStudentPayload,
} from "./student.interface.js";

const createStudentInDB = async (payload: ICreateStudentPayload) => {
  const {
    email,
    password,
    name,
    programId,
    admissionSemesterId,
    gender,
    contactNo,
    emergencyContactNo,
    address,
    bloodGroup,
  } = payload;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError(409, "User with this email already exists");
  }

  const program = await prisma.program.findUnique({
    where: { id: programId },
  });
  if (!program?.isActive) {
    throw new AppError(404, "Selected program is invalid or inactive");
  }

  const semester = await prisma.academicSemester.findUnique({
    where: { id: admissionSemesterId },
  });
  if (!semester) {
    throw new AppError(404, "Selected admission semester is invalid");
  }

  const hashedPassword = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "STUDENT",
        status: "ACTIVE",
        provider: "CREDENTIALS",
      },
    });

    const studentCount = await tx.student.count();
    const currentYear = new Date().getFullYear();
    const studentId = `STU${currentYear}${String(studentCount + 1).padStart(4, "0")}`;

    const studentProfile = await tx.student.create({
      data: {
        studentId,
        userId: user.id,
        name,
        gender,
        contactNo,
        emergencyContactNo,
        address,
        bloodGroup,
        programId,
        admissionSemesterId,
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
        program: {
          include: {
            department: true,
          },
        },
        admissionSemester: true,
      },
    });

    return studentProfile;
  });

  return result;
};

const getAllStudentsFromDB = async (
  filters: IStudentFilterOptions,
  options: IPaginationOptions,
) => {
  const { searchTerm, programId, academicStatus } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const andConditions: Prisma.StudentWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { studentId: { contains: searchTerm, mode: "insensitive" } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  if (programId) {
    andConditions.push({ programId });
  }

  if (academicStatus) {
    andConditions.push({ academicStatus });
  }

  const whereConditions: Prisma.StudentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [items, total] = await Promise.all([
    prisma.student.findMany({
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
        program: {
          include: {
            department: true,
          },
        },
        admissionSemester: true,
      },
    }),
    prisma.student.count({ where: whereConditions }),
  ]);

  return createPaginatedResponse(items, total, page, limit);
};

const getStudentByIdFromDB = async (id: string) => {
  const student = await prisma.student.findFirst({
    where: {
      OR: [{ id }, { studentId: id }],
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
      program: {
        include: {
          department: true,
        },
      },
      admissionSemester: true,
    },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  return student;
};

const getMyStudentProfileFromDB = async (userId: string) => {
  const student = await prisma.student.findUnique({
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
      program: {
        include: {
          department: true,
        },
      },
      admissionSemester: true,
    },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  return student;
};

const updateMyStudentProfileInDB = async (userId: string, payload: IUpdateStudentPayload) => {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const { name, gender, contactNo, emergencyContactNo, address, bloodGroup } = payload;

  const updatedStudent = await prisma.student.update({
    where: { userId },
    data: {
      ...(name && { name }),
      ...(gender && { gender }),
      ...(contactNo !== undefined && { contactNo }),
      ...(emergencyContactNo !== undefined && { emergencyContactNo }),
      ...(address !== undefined && { address }),
      ...(bloodGroup !== undefined && { bloodGroup }),
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
      program: true,
      admissionSemester: true,
    },
  });

  return updatedStudent;
};

const updateStudentInDB = async (id: string, payload: IUpdateStudentPayload) => {
  const student = await prisma.student.findFirst({
    where: { OR: [{ id }, { studentId: id }] },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  if (payload.programId) {
    const program = await prisma.program.findUnique({ where: { id: payload.programId } });
    if (!program) {
      throw new AppError(404, "Program not found");
    }
  }

  if (payload.admissionSemesterId) {
    const semester = await prisma.academicSemester.findUnique({
      where: { id: payload.admissionSemesterId },
    });
    if (!semester) {
      throw new AppError(404, "Admission semester not found");
    }
  }

  const updatedStudent = await prisma.student.update({
    where: { id: student.id },
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
      program: true,
      admissionSemester: true,
    },
  });

  return updatedStudent;
};

export const StudentService = {
  createStudentInDB,
  getAllStudentsFromDB,
  getStudentByIdFromDB,
  getMyStudentProfileFromDB,
  updateMyStudentProfileInDB,
  updateStudentInDB,
};
