import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { IN_SCOPE } from "@/lib/scope";
import { calculateReadiness, emptyStatusCounts } from "@/lib/compliance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AssessmentStatusBadge } from "@/components/status-badges";
import { formatDate, formatPercent } from "@/lib/utils";

export default async function AssessmentsPage() {
  const assessments = await prisma.assessment.findMany({
    orderBy: [{ assessmentDate: "desc" }, { createdAt: "desc" }],
    include: {
      organization: { select: { id: true, name: true } },
      frameworks: { include: { framework: true } },
      controlAssessments: { where: IN_SCOPE, select: { status: true } },
      assessor: { select: { name: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Assessments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Historical and in-progress assessments across all organizations.
          </p>
        </div>
        <Button asChild>
          <Link href="/assessments/new">
            <Plus /> New Assessment
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {assessments.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-500">No assessments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Frameworks</TableHead>
                  <TableHead>Assessor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => {
                  const counts = emptyStatusCounts();
                  for (const ca of assessment.controlAssessments) counts[ca.status]++;
                  return (
                    <TableRow key={assessment.id}>
                      <TableCell>
                        <Link
                          href={`/assessments/${assessment.id}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {assessment.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/organizations/${assessment.organization.id}`} className="text-slate-600 hover:underline">
                          {assessment.organization.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {assessment.frameworks.map((af) => (
                            <Badge key={af.id} variant="secondary">
                              {af.framework.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{assessment.assessor?.name ?? "—"}</TableCell>
                      <TableCell>
                        <AssessmentStatusBadge status={assessment.status} />
                      </TableCell>
                      <TableCell className="text-slate-600">{formatPercent(calculateReadiness(counts))}</TableCell>
                      <TableCell className="text-slate-600">
                        {formatDate(assessment.assessmentDate ?? assessment.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
