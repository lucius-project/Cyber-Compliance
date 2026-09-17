import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrganizationReadinessByFramework } from "@/lib/compliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/utils";

export default async function CyberInsurabilityReportPage() {
  const framework = await prisma.framework.findFirst({
    where: { name: { contains: "Insurability", mode: "insensitive" } },
  });

  const readiness = framework ? await getOrganizationReadinessByFramework(framework.id) : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <Link href="/reports" className="text-sm text-slate-500 hover:underline">
          ← Reports
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Cyber Insurability Readiness Report</h1>
        <p className="mt-1 text-sm text-slate-500">
          Readiness against {framework?.name ?? "the Cyber Insurability framework"}, per
          organization, based on each org&apos;s latest assessment.
        </p>
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        This report reflects readiness against the controls tracked in this application only. It is
        not a guarantee that any organization qualifies for cyber insurance.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!framework ? (
            <p className="text-sm text-slate-500">
              No Cyber Insurability framework configured yet. Add one under Frameworks.
            </p>
          ) : readiness.length === 0 ? (
            <p className="text-sm text-slate-500">No active organizations yet.</p>
          ) : (
            readiness.map((org) => (
              <div key={org.organizationId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <Link href={`/organizations/${org.organizationId}`} className="font-medium text-slate-900 hover:underline">
                    {org.organizationName}
                  </Link>
                  <span className="text-slate-500">
                    {org.readiness === null ? "Not assessed" : formatPercent(org.readiness)}
                  </span>
                </div>
                <Progress value={org.readiness ?? 0} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
