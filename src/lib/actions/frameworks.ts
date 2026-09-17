"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { frameworkSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/organizations";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createFramework(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = frameworkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const slug = slugify(parsed.data.name);
  const existing = await prisma.framework.findUnique({ where: { slug } });
  if (existing) {
    return { error: `A framework with a matching slug ("${slug}") already exists.` };
  }

  const framework = await prisma.framework.create({ data: { ...parsed.data, slug } });

  await recordAuditLog({
    entityType: "Framework",
    entityId: framework.id,
    action: "created",
    newValue: parsed.data,
  });

  revalidatePath("/frameworks");
  redirect(`/frameworks/${framework.id}`);
}
