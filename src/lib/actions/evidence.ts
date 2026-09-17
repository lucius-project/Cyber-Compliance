"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { getActingUserId } from "@/lib/system-user";
import { evidenceSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/organizations";

export async function createEvidence(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = evidenceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const collectedById = await getActingUserId();
  const controlAssessment = await prisma.controlAssessment.findUnique({
    where: { id: parsed.data.controlAssessmentId },
    select: { assessmentId: true },
  });
  if (!controlAssessment) return { error: "Control assessment not found" };

  const evidence = await prisma.evidence.create({
    data: { ...parsed.data, collectedById: collectedById ?? undefined },
  });

  await recordAuditLog({
    entityType: "Evidence",
    entityId: evidence.id,
    action: "added",
    newValue: { title: evidence.title, evidenceType: evidence.evidenceType },
  });

  revalidatePath(`/assessments/${controlAssessment.assessmentId}`);
  return {};
}

export async function deleteEvidence(evidenceId: string) {
  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    include: { controlAssessment: { select: { assessmentId: true } } },
  });
  if (!evidence) return;

  await prisma.evidence.delete({ where: { id: evidenceId } });

  await recordAuditLog({
    entityType: "Evidence",
    entityId: evidenceId,
    action: "removed",
    previousValue: { title: evidence.title },
  });

  revalidatePath(`/assessments/${evidence.controlAssessment.assessmentId}`);
}
