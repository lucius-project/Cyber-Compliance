import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IN_SCOPE } from "@/lib/scope";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MeetingStatusBadge,
  ControlAssessmentStatusBadge,
  RemediationPriorityBadge,
  RemediationStatusBadge,
} from "@/components/status-badges";
import { MarkDoneButton } from "@/components/remediation/mark-done-button";
import { MeetingNotesForm } from "@/components/meetings/meeting-notes-form";
import { actionItemsForControl, buildTodoEmail } from "@/lib/meeting-agenda";
import { updateMeetingStatus } from "@/lib/actions/meetings";
import { formatDate } from "@/lib/utils";

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function buildAgendaEmail(params: {
  contactName: string | null;
  orgName: string;
  sequenceNumber: number;
  scheduledAt: Date;
  controls: { controlNumber: string; name: string }[];
}): { subject: string; body: string } {
  const { contactName, orgName, sequenceNumber, scheduledAt, controls } = params;
  const dateStr = formatDate(scheduledAt);
  const timeStr = formatTime(scheduledAt);

  const subject = `Agenda: ${orgName} Compliance Review - Meeting #${sequenceNumber} (${dateStr})`;

  const lines: string[] = [];
  lines.push(`Hi ${contactName ?? "there"},`);
  lines.push("");
  lines.push(`Agenda for our compliance review meeting on ${dateStr} at ${timeStr}.`);
  lines.push("");
  lines.push(`We'll cover ${controls.length} control${controls.length === 1 ? "" : "s"}:`);
  lines.push("");
  for (const control of controls) {
    lines.push(`${control.controlNumber} - ${control.name}`);
    for (const item of actionItemsForControl(control)) {
      lines.push(`  - ${item}`);
    }
    lines.push("");
  }
  lines.push("Talk soon,");
  lines.push("Lucius");

  return { subject, body: lines.join("\n") };
}

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string; meetingId: string }>;
}) {
  const { id, meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      assessment: {
        include: {
          organization: { include: { people: { where: { active: true }, select: { email: true } } } },
          assessor: { select: { email: true } },
        },
      },
      controlAssessments: {
        where: IN_SCOPE,
        include: {
          control: { include: { frameworkMappings: { include: { frameworkRequirement: { include: { framework: true } } } } } },
          owner: { select: { name: true } },
          _count: { select: { evidence: true } },
          remediationItems: {
            orderBy: { dueDate: "asc" },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              owner: { select: { name: true } },
            },
          },
        },
        orderBy: { control: { controlNumber: "asc" } },
      },
    },
  });
  if (!meeting || meeting.assessmentId !== id) notFound();

  const { organization } = meeting.assessment;
  const { subject, body } = buildAgendaEmail({
    contactName: organization.primaryContact,
    orgName: organization.name,
    sequenceNumber: meeting.sequenceNumber,
    scheduledAt: meeting.scheduledAt,
    controls: meeting.controlAssessments.map((ca) => ca.control),
  });
  // To-do list goes to the assessor plus everyone in the client's People list.
  const todoRecipients = Array.from(
    new Set(
      [meeting.assessment.assessor?.email, ...organization.people.map((p) => p.email)].filter(
        (email): email is string => Boolean(email)
      )
    )
  );
  const todoEmail = buildTodoEmail({
    orgName: organization.name,
    sequenceNumber: meeting.sequenceNumber,
    scheduledAt: meeting.scheduledAt,
    meetingNotes: meeting.notes,
    controls: meeting.controlAssessments.map((ca) => ({ ...ca, evidenceCount: ca._count.evidence })),
  });
  const todoMailtoHref =
    todoRecipients.length > 0
      ? `mailto:${todoRecipients.map(encodeURIComponent).join(",")}?subject=${encodeURIComponent(
          todoEmail.subject
        )}&body=${encodeURIComponent(todoEmail.body)}`
      : null;

  const mailtoHref = organization.email
    ? `mailto:${encodeURIComponent(organization.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/assessments/${id}/meetings`} className="text-sm text-slate-500 hover:underline">
            ← Back to Meeting Schedule
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              Meeting #{meeting.sequenceNumber} · {formatDate(meeting.scheduledAt)} at {formatTime(meeting.scheduledAt)}
            </h1>
            <MeetingStatusBadge status={meeting.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{organization.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {todoMailtoHref && (
            <Button asChild size="sm">
              <a href={todoMailtoHref} title={`To: ${todoRecipients.join(", ")}`}>
                Email to-do list
              </a>
            </Button>
          )}
          {mailtoHref ? (
            <Button asChild variant="outline" size="sm">
              <a href={mailtoHref}>Email agenda to {organization.primaryContact ?? organization.name}</a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled title="No contact email on file for this organization">
              No contact email on file
            </Button>
          )}
          {meeting.status === "SCHEDULED" && (
            <>
              <form action={updateMeetingStatus.bind(null, meeting.id, "COMPLETED")}>
                <Button type="submit" size="sm">
                  Mark Completed
                </Button>
              </form>
              <form action={updateMeetingStatus.bind(null, meeting.id, "CANCELLED")}>
                <Button type="submit" variant="ghost" size="sm">
                  Cancel Meeting
                </Button>
              </form>
            </>
          )}
          {meeting.status !== "SCHEDULED" && (
            <form action={updateMeetingStatus.bind(null, meeting.id, "SCHEDULED")}>
              <Button type="submit" variant="ghost" size="sm">
                Reopen
              </Button>
            </form>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {meeting.controlAssessments.map((ca) => (
            <div key={ca.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/assessments/${id}/controls/${ca.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {ca.control.controlNumber} · {ca.control.name}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {ca.control.frameworkMappings.map((m) => (
                      <Badge key={m.id} variant="secondary">
                        {m.frameworkRequirement.framework.name} → {m.frameworkRequirement.code}
                      </Badge>
                    ))}
                  </div>
                </div>
                <ControlAssessmentStatusBadge status={ca.status} />
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Action Items</p>
                <ul className="mt-1.5 list-inside list-disc text-sm text-slate-700">
                  {actionItemsForControl(ca.control).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              {ca.remediationItems.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Remediation</p>
                  <ul className="mt-1.5 flex flex-col gap-2">
                    {ca.remediationItems.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div>
                          <Link href={`/remediation/${item.id}`} className="text-slate-900 hover:underline">
                            {item.title}
                          </Link>
                          <span className="text-xs text-slate-500">
                            {" "}
                            · {item.owner?.name ?? "Unassigned"} · Due {formatDate(item.dueDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RemediationPriorityBadge priority={item.priority} />
                          <RemediationStatusBadge status={item.status} />
                          <MarkDoneButton remediationId={item.id} status={item.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meeting Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingNotesForm meetingId={meeting.id} notes={meeting.notes} />
        </CardContent>
      </Card>
    </div>
  );
}
