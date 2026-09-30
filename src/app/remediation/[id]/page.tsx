import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ASSIGNABLE_USER } from "@/lib/system-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RemediationStatusBadge } from "@/components/status-badges";
import { RemediationForm } from "@/components/remediation/remediation-form";
import { MarkDoneButton } from "@/components/remediation/mark-done-button";
import { formatDate } from "@/lib/utils";

export default async function RemediationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await prisma.remediationItem.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true } },
      controlAssessment: {
        select: { id: true, assessmentId: true, control: { select: { controlNumber: true, name: true } } },
      },
    },
  });
  if (!item) notFound();

  // Assignable people: MSP staff (no organization) plus this client's own people.
  const users = await prisma.user.findMany({
    where: { ...ASSIGNABLE_USER, OR: [{ organizationId: null }, { organizationId: item.organizationId }] },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/remediation" className="text-sm text-slate-500 hover:underline">
            ← Back to Remediation
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">{item.title}</h1>
            <RemediationStatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            <Link href={`/organizations/${item.organization.id}`} className="hover:underline">
              {item.organization.name}
            </Link>
            {item.controlAssessment && (
              <>
                {" · "}
                <Link
                  href={`/assessments/${item.controlAssessment.assessmentId}/controls/${item.controlAssessment.id}`}
                  className="hover:underline"
                >
                  {item.controlAssessment.control.controlNumber} · {item.controlAssessment.control.name}
                </Link>
              </>
            )}
            {item.completedDate && ` · completed ${formatDate(item.completedDate)}`}
          </p>
        </div>
        <MarkDoneButton remediationId={item.id} status={item.status} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Remediation Item</CardTitle>
        </CardHeader>
        <CardContent>
          <RemediationForm
            fixedOrganizationId={item.organizationId}
            controlAssessmentId={item.controlAssessmentId ?? undefined}
            users={users}
            item={item}
          />
        </CardContent>
      </Card>
    </div>
  );
}
