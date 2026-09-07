import type { UserStatus } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import { AuditLogService } from "../auditLog/auditLog.service.js";

const updateUserStatusInDB = async (userId: string, status: UserStatus, actorId?: string) => {
  let user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: userId }, { studentId: userId }],
      },
      select: { userId: true },
    });
    if (student) {
      user = await prisma.user.findUnique({
        where: { id: student.userId },
      });
    }
  }

  if (!user) {
    const instructor = await prisma.instructor.findFirst({
      where: {
        OR: [{ id: userId }, { employeeId: userId }],
      },
      select: { userId: true },
    });
    if (instructor) {
      user = await prisma.user.findUnique({
        where: { id: instructor.userId },
      });
    }
  }

  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: userId.toLowerCase() },
    });
  }

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { status },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      provider: true,
      updatedAt: true,
    },
  });

  await AuditLogService.createAuditLog({
    actorId: actorId || user.id,
    action: "USER_STATUS_UPDATED",
    entityType: "USER",
    entityId: user.id,
    metadata: { status },
  });

  return updatedUser;
};

export const UserService = {
  updateUserStatusInDB,
};
