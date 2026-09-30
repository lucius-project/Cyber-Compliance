"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { organizationSchema, personSchema } from "@/lib/validation";
import { OPEN_ASSESSMENT_STATUSES, setAssessmentFrameworks } from "@/lib/scope";

export type ActionResult = { error: string; message?: undefined } | { error?: undefined; message?: string };

export async function createOrganization(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = organizationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const organization = await prisma.organization.create({ data: parsed.data });

  await recordAuditLog({
    entityType: "Organization",
    entityId: organization.id,
    action: "created",
    newValue: parsed.data,
  });

  revalidatePath("/organizations");
  redirect(`/organizations/${organization.id}`);
}

export async function updateOrganization(
  organizationId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = organizationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const before = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!before) return { error: "Organization not found" };

  const isActive = formData.get("isActive") === "on";

  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: { ...parsed.data, isActive },
  });

  await recordAuditLog({
    entityType: "Organization",
    entityId: organization.id,
    action: "updated",
    previousValue: JSON.parse(JSON.stringify(before)),
    newValue: JSON.parse(JSON.stringify(organization)),
  });

  revalidatePath(`/organizations/${organizationId}`);
  revalidatePath("/organizations");
  return {};
}

export async function addOrganizationPerson(
  organizationId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = personSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: `${parsed.data.email} is already in use by ${existing.name}` };

  const person = await prisma.user.create({ data: { ...parsed.data, organizationId } });

  await recordAuditLog({
    entityType: "User",
    entityId: person.id,
    action: "created",
    newValue: { ...parsed.data, organizationId },
  });

  revalidatePath(`/organizations/${organizationId}`);
  revalidatePath("/settings");
  return {};
}

/**
 * Sets which frameworks apply to a client, then re-scopes every open
 * assessment for that client to match. Completed/archived assessments keep
 * the frameworks they were run against.
 */
export async function setOrganizationFrameworks(
  organizationId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const frameworkIds = formData.getAll("frameworkIds").map(String).filter(Boolean);
  if (frameworkIds.length === 0) return { error: "Select at least one framework" };

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { frameworks: { select: { frameworkId: true } } },
  });
  if (!organization) return { error: "Organization not found" };

  const openAssessments = await prisma.assessment.findMany({
    where: { organizationId, status: { in: OPEN_ASSESSMENT_STATUSES } },
    select: { id: true },
  });

  const results = await prisma.$transaction(async (tx) => {
    await tx.organizationFramework.deleteMany({ where: { organizationId, frameworkId: { notIn: frameworkIds } } });
    await tx.organizationFramework.createMany({
      data: frameworkIds.map((frameworkId) => ({ organizationId, frameworkId })),
      skipDuplicates: true,
    });
    const perAssessment = [];
    for (const { id } of openAssessments) {
      perAssessment.push({ assessmentId: id, ...(await setAssessmentFrameworks(tx, id, frameworkIds)) });
    }
    return perAssessment;
  });

  await recordAuditLog({
    entityType: "Organization",
    entityId: organizationId,
    action: "frameworks_changed",
    previousValue: { frameworkIds: organization.frameworks.map((f) => f.frameworkId) },
    newValue: { frameworkIds, assessments: results },
  });

  revalidatePath(`/organizations/${organizationId}`);
  revalidatePath("/assessments", "layout");
  revalidatePath("/");

  if (results.length === 0) return { message: "Frameworks saved." };
  const shown = results.reduce((n, r) => n + r.inScope, 0);
  return {
    message: `Frameworks saved. ${results.length} open assessment${results.length === 1 ? "" : "s"} now show${
      results.length === 1 ? "s" : ""
    } ${shown} applicable control${shown === 1 ? "" : "s"}.`,
  };
}
