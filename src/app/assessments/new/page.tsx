import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewAssessmentForm } from "@/components/assessments/new-assessment-form";

export default async function NewAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const { organizationId } = await searchParams;

  const [organizations, frameworks, users, applied] = await Promise.all([
    prisma.organization.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.framework.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    organizationId
      ? prisma.organizationFramework.findMany({ where: { organizationId }, select: { frameworkId: true } })
      : [],
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Assessment</h1>
        <p className="mt-1 text-sm text-slate-500">
          Starting an assessment creates a Not Assessed entry for every control mapped to the
          selected frameworks.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewAssessmentForm
            organizations={organizations}
            frameworks={frameworks}
            users={users}
            defaultOrganizationId={organizationId}
            defaultFrameworkIds={applied.map((a) => a.frameworkId)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
