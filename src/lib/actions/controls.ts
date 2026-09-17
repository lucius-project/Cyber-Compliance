"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { controlSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/organizations";

export async function createControl(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = controlSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.control.findUnique({
    where: { controlNumber: parsed.data.controlNumber },
  });
  if (existing) {
    return { error: `Control number "${parsed.data.controlNumber}" already exists.` };
  }

  const control = await prisma.control.create({ data: parsed.data });

  await recordAuditLog({
    entityType: "Control",
    entityId: control.id,
    action: "created",
    newValue: parsed.data,
  });

  revalidatePath("/controls");
  redirect(`/controls/${control.id}`);
}

export async function toggleControlDeprecated(controlId: string, deprecated: boolean) {
  const before = await prisma.control.findUnique({ where: { id: controlId } });
  if (!before) return;

  const control = await prisma.control.update({
    where: { id: controlId },
    data: { isDeprecated: deprecated },
  });

  await recordAuditLog({
    entityType: "Control",
    entityId: control.id,
    action: deprecated ? "deprecated" : "reactivated",
    previousValue: { isDeprecated: before.isDeprecated },
    newValue: { isDeprecated: control.isDeprecated },
  });

  revalidatePath(`/controls/${controlId}`);
  revalidatePath("/controls");
}

export async function mapControlToRequirement(controlId: string, formData: FormData) {
  const frameworkRequirementId = formData.get("frameworkRequirementId");
  if (typeof frameworkRequirementId !== "string" || !frameworkRequirementId) return;

  const mapping = await prisma.controlFrameworkMapping.upsert({
    where: {
      controlId_frameworkRequirementId: { controlId, frameworkRequirementId },
    },
    create: { controlId, frameworkRequirementId },
    update: {},
  });

  await recordAuditLog({
    entityType: "ControlFrameworkMapping",
    entityId: mapping.id,
    action: "created",
    newValue: { controlId, frameworkRequirementId },
  });

  revalidatePath(`/controls/${controlId}`);
}
