import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDashboardData, getOrganizationReadinessMap } from "@/lib/compliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/utils";

export default async function ExecutiveSummaryReportPage() {
  const [data, organizations, readinessMap] = await Promise.all([
    getDashboardData(),
    prisma.organization.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getOrganizationReadinessMap(),
  ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <Link href="/reports" className="text-sm text-slate-500 hover:underline">
          ← Reports
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Executive Summary</h1>
        <p className="mt-1 text-sm text-slate-500">
          Portfolio-wide readiness across {data.organizationCount} active organization
          {data.organizationCount === 1 ? "" : "s"}, generated {new Date().toLocaleDateString()}.
        </p>
      </div>

      <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        Readiness reflects progress against the controls tracked in this application. It is not a
        guarantee of cyber insurance eligibility or approval.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Readiness by Framework</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {data.byFramework.map((fw) => (
            <div key={fw.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">{fw.name}</span>
                <span className="text-slate-500">{formatPercent(fw.readiness)}</span>
              </div>
              <Progress value={fw.readiness} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Readiness by Organization</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {organizations.map((org) => {
            const readiness = readinessMap.get(org.id);
            return (
              <div key={org.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <Link href={`/organizations/${org.id}`} className="font-medium text-slate-900 hover:underline">
                    {org.name}
                  </Link>
                  <span className="text-slate-500">
                    {readiness?.readiness === null || readiness?.readiness === undefined
                      ? "Not assessed"
                      : formatPercent(readiness.readiness)}
                  </span>
                </div>
                <Progress value={readiness?.readiness ?? 0} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
