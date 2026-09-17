import { prisma } from "@/lib/prisma";
import { getActingUserId } from "@/lib/system-user";
import type { Prisma } from "@prisma/client";

export async function recordAuditLog(params: {
  entityType: string;
  entityId: string;
  action: string;
  previousValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
}) {
  const actorId = await getActingUserId();

  await prisma.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorId,
      previousValue: params.previousValue ?? undefined,
      newValue: params.newValue ?? undefined,
    },
  });
}
