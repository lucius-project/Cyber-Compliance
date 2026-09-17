import { prisma } from "@/lib/prisma";
import type { ControlAssessmentStatus } from "@prisma/client";

export type StatusCounts = Record<ControlAssessmentStatus, number>;

const EMPTY_COUNTS: StatusCounts = {
  NOT_ASSESSED: 0,
  NOT_STARTED: 0,
  IN_PROGRESS: 0,
  IMPLEMENTED: 0,
  NOT_APPLICABLE: 0,
};

export function emptyStatusCounts(): StatusCounts {
  return { ...EMPTY_COUNTS };
}

/**
 * Readiness = implemented / applicable, where "applicable" excludes
 * NOT_APPLICABLE controls. Never stored - always derived from current
 * ControlAssessment rows so it can't drift from the underlying data.
 */
export function calculateReadiness(counts: StatusCounts): number {
  const applicable =
    counts.NOT_ASSESSED + counts.NOT_STARTED + counts.IN_PROGRESS + counts.IMPLEMENTED;
  if (applicable === 0) return 0;
  return (counts.IMPLEMENTED / applicable) * 100;
}

export async function getStatusCountsWhere(
  where: Parameters<typeof prisma.controlAssessment.groupBy>[0]["where"]
): Promise<StatusCounts> {
  const grouped = await prisma.controlAssessment.groupBy({
    by: ["status"],
    where,
    _count: { _all: true },
  });

  const counts = emptyStatusCounts();
  for (const row of grouped) {
    counts[row.status] = row._count._all;
  }
  return counts;
}

export type FrameworkReadiness = {
  id: string;
  name: string;
  readiness: number;
  counts: StatusCounts;
};

export type CategoryReadiness = {
  category: string;
  readiness: number;
  counts: StatusCounts;
};

export type DashboardData = {
  overallCounts: StatusCounts;
  overallReadiness: number;
  organizationCount: number;
  openRemediationCount: number;
  overdueRemediationCount: number;
  byFramework: FrameworkReadiness[];
  byCategory: CategoryReadiness[];
};

/** Aggregates the current (latest-per-organization) compliance picture for the dashboard. */
export async function getDashboardData(): Promise<DashboardData> {
  const [latestAssessmentIds, organizationCount, frameworks] = await Promise.all([
    getLatestAssessmentIdsPerOrganization(),
    prisma.organization.count({ where: { isActive: true } }),
    prisma.framework.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const controlAssessments = await prisma.controlAssessment.findMany({
    where: { assessmentId: { in: latestAssessmentIds } },
    select: {
      status: true,
      control: {
        select: {
          category: true,
          frameworkMappings: {
            select: { frameworkRequirement: { select: { frameworkId: true } } },
          },
        },
      },
    },
  });

  const overallCounts = emptyStatusCounts();
  const byFrameworkCounts = new Map<string, StatusCounts>(
    frameworks.map((f) => [f.id, emptyStatusCounts()])
  );
  const byCategoryCounts = new Map<string, StatusCounts>();

  for (const ca of controlAssessments) {
    overallCounts[ca.status]++;

    const category = ca.control.category?.trim() || "Uncategorized";
    if (!byCategoryCounts.has(category)) byCategoryCounts.set(category, emptyStatusCounts());
    byCategoryCounts.get(category)![ca.status]++;

    const frameworkIdsForControl = new Set(
      ca.control.frameworkMappings.map((m) => m.frameworkRequirement.frameworkId)
    );
    for (const frameworkId of frameworkIdsForControl) {
      const bucket = byFrameworkCounts.get(frameworkId);
      if (bucket) bucket[ca.status]++;
    }
  }

  const [openRemediationCount, overdueRemediationCount] = await Promise.all([
    prisma.remediationItem.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
    }),
    prisma.remediationItem.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  return {
    overallCounts,
    overallReadiness: calculateReadiness(overallCounts),
    organizationCount,
    openRemediationCount,
    overdueRemediationCount,
    byFramework: frameworks.map((f) => {
      const counts = byFrameworkCounts.get(f.id)!;
      return { id: f.id, name: f.name, readiness: calculateReadiness(counts), counts };
    }),
    byCategory: Array.from(byCategoryCounts.entries())
      .map(([category, counts]) => ({
        category,
        readiness: calculateReadiness(counts),
        counts,
      }))
      .sort((a, b) => a.category.localeCompare(b.category)),
  };
}

export type OrganizationFrameworkReadiness = {
  organizationId: string;
  organizationName: string;
  readiness: number | null;
  counts: StatusCounts;
};

/** Per-organization readiness scoped to a single framework's mapped controls, using each org's latest assessment. */
export async function getOrganizationReadinessByFramework(
  frameworkId: string
): Promise<OrganizationFrameworkReadiness[]> {
  const organizations = await prisma.organization.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      assessments: {
        orderBy: [{ assessmentDate: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          controlAssessments: {
            where: {
              control: {
                frameworkMappings: { some: { frameworkRequirement: { frameworkId } } },
              },
            },
            select: { status: true },
          },
        },
      },
    },
  });

  return organizations.map((org) => {
    const latest = org.assessments[0];
    if (!latest || latest.controlAssessments.length === 0) {
      return { organizationId: org.id, organizationName: org.name, readiness: null, counts: emptyStatusCounts() };
    }
    const counts = emptyStatusCounts();
    for (const ca of latest.controlAssessments) counts[ca.status]++;
    return {
      organizationId: org.id,
      organizationName: org.name,
      readiness: calculateReadiness(counts),
      counts,
    };
  });
}

/** Latest assessment per organization (by assessmentDate, falling back to createdAt). */
export async function getLatestAssessmentIdsPerOrganization(): Promise<string[]> {
  const organizations = await prisma.organization.findMany({
    where: { isActive: true },
    select: {
      assessments: {
        orderBy: [{ assessmentDate: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: { id: true },
      },
    },
  });

  return organizations.flatMap((org) => org.assessments.map((a) => a.id));
}

export type OrganizationReadiness = {
  id: string;
  latestAssessmentId: string | null;
  readiness: number | null;
  assessmentCount: number;
};

/** Readiness per organization, derived from each org's most recent assessment. */
export async function getOrganizationReadinessMap(): Promise<Map<string, OrganizationReadiness>> {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      _count: { select: { assessments: true } },
      assessments: {
        orderBy: [{ assessmentDate: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: { id: true, controlAssessments: { select: { status: true } } },
      },
    },
  });

  const map = new Map<string, OrganizationReadiness>();
  for (const org of organizations) {
    const latest = org.assessments[0];
    if (!latest) {
      map.set(org.id, { id: org.id, latestAssessmentId: null, readiness: null, assessmentCount: 0 });
      continue;
    }
    const counts = emptyStatusCounts();
    for (const ca of latest.controlAssessments) counts[ca.status]++;
    map.set(org.id, {
      id: org.id,
      latestAssessmentId: latest.id,
      readiness: calculateReadiness(counts),
      assessmentCount: org._count.assessments,
    });
  }
  return map;
}
