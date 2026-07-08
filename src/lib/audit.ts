import { prisma } from "./prisma";

export async function createAuditLog(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || "",
      details: params.details || "",
      ipAddress: params.ipAddress || "",
    },
  });
}
