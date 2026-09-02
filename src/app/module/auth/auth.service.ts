import bcrypt from "bcryptjs";
import config from "../../config/index.js";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import { createToken, verifyToken } from "../../utils/jwt.js";
import type {
  ILoginUser,
  ILoginUserResponse,
  IRefreshTokenResponse,
  IRegisterStudent,
} from "./auth.interface.js";

const registerStudentIntoDB = async (payload: IRegisterStudent) => {
  const { email, password, name, programId, admissionSemesterId, gender, contactNo } = payload;

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
        program: true,
        admissionSemester: true,
      },
    });

    return studentProfile;
  });

  return result;
};

const loginUserFromDB = async (payload: ILoginUser): Promise<ILoginUserResponse> => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.status === "BLOCKED") {
    throw new AppError(403, "Your account is blocked. Please contact administration.");
  }

  if (user.status === "DELETED") {
    throw new AppError(403, "Your account has been deleted.");
  }

  if (!user.password) {
    throw new AppError(400, "Please login using your social provider (Google)");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    throw new AppError(401, "Invalid credentials");
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.JWT_ACCESS_SECRET,
    config.JWT_ACCESS_EXPIRES_IN,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.JWT_REFRESH_SECRET,
    config.JWT_REFRESH_EXPIRES_IN,
  );

  return {
    accessToken,
    refreshToken,
    needPasswordChange: user.needPasswordChange,
  };
};

const refreshToken = async (token: string): Promise<IRefreshTokenResponse> => {
  let verifiedToken = null;
  try {
    verifiedToken = verifyToken(token, config.JWT_REFRESH_SECRET);
  } catch (_err) {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const { userId } = verifiedToken;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.status === "BLOCKED") {
    throw new AppError(403, "Your account is blocked.");
  }

  if (user.status === "DELETED") {
    throw new AppError(403, "Your account has been deleted.");
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = createToken(
    jwtPayload,
    config.JWT_ACCESS_SECRET,
    config.JWT_ACCESS_EXPIRES_IN,
  );

  return {
    accessToken: newAccessToken,
  };
};

export const AuthService = {
  registerStudentIntoDB,
  loginUserFromDB,
  refreshToken,
};
