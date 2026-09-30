"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { organizationSchema, personSchema } from "@/lib/validation";

export type ActionResult = { error: string } | { error?: undefined };

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

