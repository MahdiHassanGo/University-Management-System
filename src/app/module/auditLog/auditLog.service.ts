import prisma from "../../lib/prisma.js";
import {
  calculatePagination,
  createPaginatedResponse,
  type IPaginationOptions,
} from "../../utils/pagination.js";

export interface ICreateAuditLogPayload {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface IAuditLogFilterOptions {
  actorId?: string;
  action?: string;
  entityType?: string;
}

const createAuditLog = async (payload: ICreateAuditLogPayload) => {
  try {
    const log = await prisma.auditLog.create({
      data: {
        actorId: payload.actorId || null,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId || null,
        metadata: payload.metadata ? JSON.parse(JSON.stringify(payload.metadata)) : undefined,
      },
    });
    return log;
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
};

const getAllAuditLogsFromDB = async (
  filters: IAuditLogFilterOptions,
  options: IPaginationOptions,
) => {
  const { actorId, action, entityType } = filters;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const andConditions: Array<Record<string, unknown>> = [];

  if (actorId) {
    andConditions.push({ actorId });
  }

  if (action) {
    andConditions.push({ action: { contains: action, mode: "insensitive" } });
  }

  if (entityType) {
    andConditions.push({ entityType: { contains: entityType, mode: "insensitive" } });
  }

  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where: whereConditions }),
  ]);

  return createPaginatedResponse(items, total, page, limit);
};

export const AuditLogService = {
  createAuditLog,
  getAllAuditLogsFromDB,
};
