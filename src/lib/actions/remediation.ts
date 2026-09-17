"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { remediationSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/organizations";

export async function createRemediationItem(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = remediationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const item = await prisma.remediationItem.create({
    data: {
      ...parsed.data,
      controlAssessmentId: parsed.data.controlAssessmentId || undefined,
      ownerId: parsed.data.ownerId || undefined,
    },
  });

  await recordAuditLog({
    entityType: "RemediationItem",
    entityId: item.id,
    action: "created",
    newValue: { title: item.title, priority: item.priority, status: item.status },
  });

  revalidatePath("/remediation");
  revalidatePath(`/organizations/${parsed.data.organizationId}`);
  if (parsed.data.controlAssessmentId) {
    const controlAssessment = await prisma.controlAssessment.findUnique({
      where: { id: parsed.data.controlAssessmentId },
      select: { assessmentId: true },
    });
    if (controlAssessment) revalidatePath(`/assessments/${controlAssessment.assessmentId}`);
  }
  return {};
}

export async function updateRemediationStatus(remediationId: string, status: string) {
  const before = await prisma.remediationItem.findUnique({ where: { id: remediationId } });
  if (!before) return;

  const completedDate = status === "COMPLETED" ? new Date() : null;

  const item = await prisma.remediationItem.update({
    where: { id: remediationId },
    data: { status: status as typeof before.status, completedDate },
  });

  await recordAuditLog({
    entityType: "RemediationItem",
    entityId: item.id,
    action: "status_changed",
    previousValue: { status: before.status },
    newValue: { status: item.status },
  });

  revalidatePath("/remediation");
  revalidatePath(`/organizations/${item.organizationId}`);
}
