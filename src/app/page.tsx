import Link from "next/link";
import { AlertTriangle, Building2, CheckCircle2, ClipboardList, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/compliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPercent } from "@/lib/utils";
import { RemediationPriorityBadge } from "@/components/status-badges";

export default async function DashboardPage() {
  const data = await getDashboardData();

  const overdueItems = await prisma.remediationItem.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] }, dueDate: { lt: new Date() } },
    orderBy: { dueDate: "asc" },
    take: 5,
    include: { organization: { select: { name: true } } },
  });

  const applicableControls =
    data.overallCounts.NOT_ASSESSED +
    data.overallCounts.NOT_STARTED +
    data.overallCounts.IN_PROGRESS +
    data.overallCounts.IMPLEMENTED;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Current readiness across all active client organizations, based on each client&apos;s
          most recent assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={CheckCircle2}
          label="Overall Readiness"
          value={formatPercent(data.overallReadiness)}
          hint={`${applicableControls} applicable controls`}
        />
        <MetricCard icon={Building2} label="Active Organizations" value={String(data.organizationCount)} />
        <MetricCard
          icon={Wrench}
          label="Open Remediation Items"
          value={String(data.openRemediationCount)}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Overdue Remediation"
          value={String(data.overdueRemediationCount)}
          tone={data.overdueRemediationCount > 0 ? "warning" : "default"}
        />
      </div>

      <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        Readiness reflects progress against the controls tracked in this application. It is not a
        guarantee of cyber insurance eligibility or approval.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Control Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <StatusRow label="Implemented" count={data.overallCounts.IMPLEMENTED} variant="success" />
            <StatusRow label="In Progress" count={data.overallCounts.IN_PROGRESS} variant="info" />
            <StatusRow label="Not Started" count={data.overallCounts.NOT_STARTED} variant="warning" />
            <StatusRow label="Not Assessed" count={data.overallCounts.NOT_ASSESSED} variant="secondary" />
            <StatusRow
              label="Not Applicable"
              count={data.overallCounts.NOT_APPLICABLE}
              variant="outline"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue Remediation</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueItems.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing overdue right now.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {overdueItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <Link
                        href="/remediation"
                        className="truncate font-medium text-slate-900 hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {item.organization.name} · due {formatDate(item.dueDate)}
                      </p>
                    </div>
                    <RemediationPriorityBadge priority={item.priority} />
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/remediation"
              className="mt-4 inline-block text-sm font-medium text-slate-900 hover:underline"
            >
              View all remediation items →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Readiness by Framework</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.byFramework.length === 0 ? (
              <p className="text-sm text-slate-500">No frameworks configured yet.</p>
            ) : (
              data.byFramework.map((fw) => (
                <div key={fw.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">{fw.name}</span>
                    <span className="text-slate-500">{formatPercent(fw.readiness)}</span>
                  </div>
                  <Progress value={fw.readiness} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Readiness by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.byCategory.length === 0 ? (
              <p className="text-sm text-slate-500">No assessed controls yet.</p>
            ) : (
              data.byCategory.map((cat) => (
                <div key={cat.category} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">{cat.category}</span>
                    <span className="text-slate-500">{formatPercent(cat.readiness)}</span>
                  </div>
                  <Progress value={cat.readiness} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              tone === "warning" && value !== "0" ? "text-amber-600" : "text-slate-900"
            }`}
          >
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <Icon className="size-8 text-slate-300" />
      </CardContent>
    </Card>
  );
}

function StatusRow({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: "success" | "info" | "warning" | "secondary" | "outline";
}) {
  return (
    <div className="flex items-center justify-between">
      <Badge variant={variant}>{label}</Badge>
      <span className="text-sm font-medium text-slate-900">{count}</span>
    </div>
  );
}
