import type { AssessmentStatus, Prisma } from "@prisma/client";

/** Assessments that follow their organization's framework selection. Completed/archived ones are historical and frozen. */
export const OPEN_ASSESSMENT_STATUSES: AssessmentStatus[] = ["DRAFT", "IN_PROGRESS"];

/** Filter for the controls that count on an assessment - use on every list/readiness read of ControlAssessment. */
export const IN_SCOPE = { inScope: true } as const;

/**
 * Meetings worth listing: those with at least one in-scope control, or that
 * already happened / have notes. Hides meeting slots emptied by removing a
 * framework, without deleting them.
 */
export const VISIBLE_MEETING = {
  OR: [{ controlAssessments: { some: IN_SCOPE } }, { status: { not: "SCHEDULED" } }, { notes: { not: null } }],
} satisfies Prisma.MeetingWhereInput;

/**
 * Brings an assessment's ControlAssessment rows in line with its current
 * AssessmentFramework rows: creates a row for every newly in-scope control,
 * and flips `inScope` on existing rows. Never deletes rows, so evidence,
 * remediation, owners and meeting slots survive a framework being removed
 * and come back if it is re-applied.
 */
export async function syncAssessmentScope(tx: Prisma.TransactionClient, assessmentId: string) {
  const frameworks = await tx.assessmentFramework.findMany({
    where: { assessmentId },
    select: { frameworkId: true },
  });
  const frameworkIds = frameworks.map((f) => f.frameworkId);

  const inScopeControls = await tx.control.findMany({
    where: {
      isDeprecated: false,
      frameworkMappings: { some: { frameworkRequirement: { frameworkId: { in: frameworkIds } } } },
    },
    select: { id: true },
  });
  const inScopeIds = inScopeControls.map((c) => c.id);

  const created = await tx.controlAssessment.createMany({
    data: inScopeIds.map((controlId) => ({ assessmentId, controlId })),
    skipDuplicates: true,
  });
  const restored = await tx.controlAssessment.updateMany({
    where: { assessmentId, inScope: false, controlId: { in: inScopeIds } },
    data: { inScope: true },
  });
  const hidden = await tx.controlAssessment.updateMany({
    where: { assessmentId, inScope: true, controlId: { notIn: inScopeIds } },
    data: { inScope: false },
  });

  return { created: created.count, restored: restored.count, hidden: hidden.count, inScope: inScopeIds.length };
}

/** Replaces an assessment's frameworks with `frameworkIds` and re-scopes its controls. */
export async function setAssessmentFrameworks(
  tx: Prisma.TransactionClient,
  assessmentId: string,
  frameworkIds: string[]
) {
  await tx.assessmentFramework.deleteMany({ where: { assessmentId, frameworkId: { notIn: frameworkIds } } });
  await tx.assessmentFramework.createMany({
    data: frameworkIds.map((frameworkId) => ({ assessmentId, frameworkId })),
    skipDuplicates: true,
  });
  return syncAssessmentScope(tx, assessmentId);
}
