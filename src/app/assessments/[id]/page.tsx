import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IN_SCOPE } from "@/lib/scope";
import { calculateReadiness, emptyStatusCounts } from "@/lib/compliance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AssessmentStatusBadge, ControlAssessmentStatusBadge } from "@/components/status-badges";
import { formatDate, formatPercent } from "@/lib/utils";
import { updateAssessmentStatus } from "@/lib/actions/assessments";
import type { AssessmentStatus } from "@prisma/client";

const STATUS_FLOW: AssessmentStatus[] = ["DRAFT", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      organization: true,
      assessor: { select: { name: true } },
      frameworks: { include: { framework: true } },
      _count: { select: { controlAssessments: { where: { inScope: false } } } },
      controlAssessments: {
        where: IN_SCOPE,
        include: {
          control: true,
          owner: { select: { name: true } },
          _count: { select: { evidence: true, remediationItems: true } },
        },
        orderBy: [{ control: { category: "asc" } }, { control: { controlNumber: "asc" } }],
      },
    },
  });

  if (!assessment) notFound();

  const counts = emptyStatusCounts();
  for (const ca of assessment.controlAssessments) counts[ca.status]++;
  const readiness = calculateReadiness(counts);

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(assessment.status) + 1];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">{assessment.name}</h1>
            <AssessmentStatusBadge status={assessment.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            <Link href={`/organizations/${assessment.organization.id}`} className="hover:underline">
              {assessment.organization.name}
            </Link>{" "}
            · {formatDate(assessment.assessmentDate ?? assessment.createdAt)} · assessor{" "}
            {assessment.assessor?.name ?? "unassigned"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {assessment.frameworks.map((af) => (
              <Badge key={af.id} variant="secondary">
                {af.framework.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/assessments/${assessment.id}/meetings`}>Meeting Schedule</Link>
          </Button>
          {nextStatus && (
            <form action={updateAssessmentStatus.bind(null, assessment.id, nextStatus)}>
              <Button type="submit" variant="outline" size="sm">
                Move to {nextStatus.replace("_", " ")}
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Readiness" value={formatPercent(readiness)} />
        <MiniStat label="Implemented" value={counts.IMPLEMENTED} />
        <MiniStat label="In Progress" value={counts.IN_PROGRESS} />
        <MiniStat label="Not Started" value={counts.NOT_STARTED} />
        <MiniStat label="Not Assessed" value={counts.NOT_ASSESSED} />
        <MiniStat label="Not Applicable" value={counts.NOT_APPLICABLE} />
      </div>

      {assessment.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{assessment.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Controls ({assessment.controlAssessments.length})</CardTitle>
          {assessment._count.controlAssessments > 0 && (
            <p className="text-sm text-slate-500">
              {assessment._count.controlAssessments} controls outside this client&apos;s{" "}
              <Link href={`/organizations/${assessment.organization.id}`} className="underline">
                applicable frameworks
              </Link>{" "}
              are hidden. Their data is kept.
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {assessment.controlAssessments.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-500">
              No controls mapped to the selected frameworks yet. Import or map controls first.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Remediation</TableHead>
                  <TableHead>Next Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessment.controlAssessments.map((ca) => (
                  <TableRow key={ca.id}>
                    <TableCell>
                      <Link
                        href={`/assessments/${assessment.id}/controls/${ca.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {ca.control.controlNumber} · {ca.control.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-600">{ca.control.category ?? "—"}</TableCell>
                    <TableCell>
                      <ControlAssessmentStatusBadge status={ca.status} />
                    </TableCell>
                    <TableCell className="text-slate-600">{ca.owner?.name ?? "Unassigned"}</TableCell>
                    <TableCell className="text-slate-600">{ca._count.evidence}</TableCell>
                    <TableCell className="text-slate-600">{ca._count.remediationItems}</TableCell>
                    <TableCell className="text-slate-600">{formatDate(ca.nextReviewAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
