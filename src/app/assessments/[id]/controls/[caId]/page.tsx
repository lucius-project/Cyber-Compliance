import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RemediationStatusBadge, RemediationPriorityBadge } from "@/components/status-badges";
import { ControlAssessmentStatusForm } from "@/components/control-assessments/status-form";
import { EvidenceSection } from "@/components/control-assessments/evidence-section";
import { RemediationForm } from "@/components/remediation/remediation-form";
import { MarkDoneButton } from "@/components/remediation/mark-done-button";
import { formatDate } from "@/lib/utils";

export default async function ControlAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; caId: string }>;
}) {
  const { id, caId } = await params;

  const controlAssessment = await prisma.controlAssessment.findUnique({
    where: { id: caId },
    include: {
      control: {
        include: { frameworkMappings: { include: { frameworkRequirement: { include: { framework: true } } } } },
      },
      assessment: { include: { organization: true } },
      evidence: { orderBy: { createdAt: "desc" }, include: { collectedBy: { select: { name: true } } } },
      remediationItems: { orderBy: { createdAt: "desc" }, include: { owner: { select: { name: true } } } },
    },
  });

  if (!controlAssessment || controlAssessment.assessmentId !== id) notFound();

  // Assignable people: MSP staff (no organization) plus this client's own people.
  const users = await prisma.user.findMany({
    where: {
      active: true,
      OR: [{ organizationId: null }, { organizationId: controlAssessment.assessment.organizationId }],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/assessments/${id}`} className="text-sm text-slate-500 hover:underline">
          ← Back to {controlAssessment.assessment.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {controlAssessment.control.controlNumber} · {controlAssessment.control.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{controlAssessment.assessment.organization.name}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {controlAssessment.control.frameworkMappings.map((m) => (
            <Badge key={m.id} variant="secondary">
              {m.frameworkRequirement.framework.name} → {m.frameworkRequirement.code}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Control Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {controlAssessment.control.description || "No description provided."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Control Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {controlAssessment.control.guidance || "No guidance provided."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <ControlAssessmentStatusForm controlAssessment={controlAssessment} users={users} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <EvidenceSection controlAssessmentId={controlAssessment.id} evidence={controlAssessment.evidence} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remediation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {controlAssessment.remediationItems.length > 0 && (
            <ul className="flex flex-col gap-2">
              {controlAssessment.remediationItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 p-3 text-sm"
                >
                  <div>
                    <Link href={`/remediation/${item.id}`} className="font-medium text-slate-900 hover:underline">
                      {item.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      Owner: {item.owner?.name ?? "Unassigned"} · Due {formatDate(item.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RemediationPriorityBadge priority={item.priority} />
                    <RemediationStatusBadge status={item.status} />
                    <MarkDoneButton remediationId={item.id} status={item.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 pt-4">
            <RemediationForm
              fixedOrganizationId={controlAssessment.assessment.organizationId}
              controlAssessmentId={controlAssessment.id}
              users={users}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
