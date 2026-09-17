"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { assessmentSchema, controlAssessmentUpdateSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/organizations";

export async function createAssessment(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = assessmentSchema.safeParse({
    ...raw,
    frameworkIds: formData.getAll("frameworkIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { organizationId, name, assessmentDate, assessorId, notes, frameworkIds } = parsed.data;

  // Every Control mapped (via any FrameworkRequirement) to any selected
  // framework becomes a NOT_ASSESSED ControlAssessment row on creation.
  const controlIds = await prisma.control.findMany({
    where: {
      isDeprecated: false,
      frameworkMappings: {
        some: { frameworkRequirement: { frameworkId: { in: frameworkIds } } },
      },
    },
    select: { id: true },
  });

  const assessment = await prisma.assessment.create({
    data: {
      organizationId,
      name,
      assessmentDate,
      assessorId: assessorId || undefined,
      notes,
      status: "DRAFT",
      frameworks: { create: frameworkIds.map((frameworkId) => ({ frameworkId })) },
      controlAssessments: {
        create: controlIds.map(({ id: controlId }) => ({ controlId })),
      },
    },
  });

  await recordAuditLog({
    entityType: "Assessment",
    entityId: assessment.id,
    action: "created",
    newValue: { organizationId, name, frameworkIds, controlCount: controlIds.length },
  });

  revalidatePath("/assessments");
  revalidatePath(`/organizations/${organizationId}`);
  redirect(`/assessments/${assessment.id}`);
}

export async function updateAssessmentStatus(assessmentId: string, status: string) {
  const before = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!before) return;

  const data: { status: typeof before.status; startedDate?: Date; completedDate?: Date } = {
    status: status as typeof before.status,
  };
  if (status === "IN_PROGRESS" && !before.startedDate) data.startedDate = new Date();
  if (status === "COMPLETED") data.completedDate = new Date();

  const assessment = await prisma.assessment.update({ where: { id: assessmentId }, data });

  await recordAuditLog({
    entityType: "Assessment",
    entityId: assessment.id,
    action: "status_changed",
    previousValue: { status: before.status },
    newValue: { status: assessment.status },
  });

  revalidatePath(`/assessments/${assessmentId}`);
  revalidatePath("/assessments");
}

export async function updateControlAssessment(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = controlAssessmentUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { controlAssessmentId, ...rest } = parsed.data;

  const before = await prisma.controlAssessment.findUnique({ where: { id: controlAssessmentId } });
  if (!before) return { error: "Control assessment not found" };

  const controlAssessment = await prisma.controlAssessment.update({
    where: { id: controlAssessmentId },
    data: {
      status: rest.status,
      isApplicable: rest.isApplicable ?? before.isApplicable,
      ownerId: rest.ownerId || null,
      assessorId: rest.assessorId || null,
      notes: rest.notes,
      lastReviewedAt: rest.lastReviewedAt,
      nextReviewAt: rest.nextReviewAt,
    },
  });

  if (before.status !== controlAssessment.status) {
    await recordAuditLog({
      entityType: "ControlAssessment",
      entityId: controlAssessment.id,
      action: "status_changed",
      previousValue: { status: before.status },
      newValue: { status: controlAssessment.status },
    });
  }

  revalidatePath(`/assessments/${controlAssessment.assessmentId}`);
  return {};
}
