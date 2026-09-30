"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { OPEN_ASSESSMENT_STATUSES, syncAssessmentScope } from "@/lib/scope";
import { recordAuditLog } from "@/lib/audit";
import { csvToRecords } from "@/lib/csv";

export type ImportSummary = {
  rowsProcessed: number;
  controlsCreated: number;
  controlsExisting: number;
  frameworksCreated: number;
  requirementsCreated: number;
  mappingsCreated: number;
  mappingsAlreadyExisted: number;
  errors: { row: number; message: string }[];
};

export type ImportState = { error?: string; summary?: ImportSummary };

const REQUIRED_COLUMNS = ["control_number", "control_name"];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isTruthyFlag(value: string): boolean {
  return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
}

export async function importControlsCsv(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file to import." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File is too large (5MB limit)." };
  }

  const text = await file.text();
  const records = csvToRecords(text);

  if (records.length === 0) {
    return { error: "The CSV file has no data rows." };
  }

  const headerColumns = Object.keys(records[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !headerColumns.includes(c));
  if (missingColumns.length > 0) {
    return { error: `Missing required column(s): ${missingColumns.join(", ")}` };
  }

  const summary: ImportSummary = {
    rowsProcessed: 0,
    controlsCreated: 0,
    controlsExisting: 0,
    frameworksCreated: 0,
    requirementsCreated: 0,
    mappingsCreated: 0,
    mappingsAlreadyExisted: 0,
    errors: [],
  };

  // Caches so repeated rows for the same control/framework don't re-query.
  const controlCache = new Map<string, { id: string; isNew: boolean }>();
  const frameworkCache = new Map<string, string>();

  for (let i = 0; i < records.length; i++) {
    const rowNumber = i + 2; // account for header row, 1-indexed
    const row = records[i];
    summary.rowsProcessed++;

    const controlNumber = row.control_number?.trim();
    const controlName = row.control_name?.trim();

    if (!controlNumber || !controlName) {
      summary.errors.push({ row: rowNumber, message: "control_number and control_name are required" });
      continue;
    }

    try {
      let controlEntry = controlCache.get(controlNumber);
      if (!controlEntry) {
        const existingControl = await prisma.control.findUnique({ where: { controlNumber } });
        if (existingControl) {
          controlEntry = { id: existingControl.id, isNew: false };
          summary.controlsExisting++;
        } else {
          const created = await prisma.control.create({
            data: {
              controlNumber,
              name: controlName,
              description: row.description?.trim() || undefined,
              category: row.category?.trim() || undefined,
              isDeprecated: row.deprecated ? isTruthyFlag(row.deprecated) : false,
            },
          });
          controlEntry = { id: created.id, isNew: true };
          summary.controlsCreated++;
        }
        controlCache.set(controlNumber, controlEntry);
      }

      const frameworkName = row.framework?.trim();
      const requirementCode = row.framework_requirement?.trim();

      if (!frameworkName || !requirementCode) {
        // Control-only row: valid, just nothing to map.
        continue;
      }

      let frameworkId = frameworkCache.get(frameworkName);
      if (!frameworkId) {
        const slug = slugify(frameworkName);
        const existingFramework = await prisma.framework.findUnique({ where: { slug } });
        const framework =
          existingFramework ?? (await prisma.framework.create({ data: { name: frameworkName, slug } }));
        if (!existingFramework) summary.frameworksCreated++;
        frameworkId = framework.id;
        frameworkCache.set(frameworkName, frameworkId);
      }

      const existingRequirement = await prisma.frameworkRequirement.findUnique({
        where: { frameworkId_code: { frameworkId, code: requirementCode } },
      });
      const requirement =
        existingRequirement ??
        (await prisma.frameworkRequirement.create({
          data: { frameworkId, code: requirementCode },
        }));
      if (!existingRequirement) summary.requirementsCreated++;

      const existingMapping = await prisma.controlFrameworkMapping.findUnique({
        where: {
          controlId_frameworkRequirementId: {
            controlId: controlEntry.id,
            frameworkRequirementId: requirement.id,
          },
        },
      });
      if (existingMapping) {
        summary.mappingsAlreadyExisted++;
      } else {
        await prisma.controlFrameworkMapping.create({
          data: { controlId: controlEntry.id, frameworkRequirementId: requirement.id },
        });
        summary.mappingsCreated++;
      }
    } catch (err) {
      summary.errors.push({
        row: rowNumber,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  await recordAuditLog({
    entityType: "ControlImport",
    entityId: `import-${Date.now()}`,
    action: "csv_import",
    newValue: summary,
  });

  // New mappings can bring more controls into scope for open assessments.
  if (summary.mappingsCreated > 0) {
    const openAssessments = await prisma.assessment.findMany({
      where: { status: { in: OPEN_ASSESSMENT_STATUSES } },
      select: { id: true },
    });
    for (const { id } of openAssessments) {
      await prisma.$transaction((tx) => syncAssessmentScope(tx, id));
    }
    revalidatePath("/assessments", "layout");
  }

  revalidatePath("/controls");
  revalidatePath("/frameworks");

  return { summary };
}
