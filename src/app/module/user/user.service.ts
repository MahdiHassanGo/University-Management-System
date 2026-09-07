import type { UserStatus } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import { AuditLogService } from "../auditLog/auditLog.service.js";

const updateUserStatusInDB = async (userId: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
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
    actorId: userId,
    action: "USER_STATUS_UPDATED",
    entityType: "USER",
    entityId: userId,
    metadata: { status },
  });

  return updatedUser;
};

export const UserService = {
  updateUserStatusInDB,
};
