import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CLEARABLE_MEETING, IN_SCOPE, VISIBLE_MEETING } from "@/lib/scope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { MeetingStatusBadge } from "@/components/status-badges";
import { GenerateScheduleForm } from "@/components/meetings/generate-schedule-form";
import { ClearScheduleButton } from "@/components/meetings/clear-schedule-button";
import { formatDate } from "@/lib/utils";

export default async function MeetingsListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { organization: { select: { name: true } } },
  });
  if (!assessment) notFound();

  const [meetings, unscheduledCount, clearableCount, lastMeeting] = await Promise.all([
    prisma.meeting.findMany({
      where: { assessmentId: id, ...VISIBLE_MEETING },
      orderBy: { sequenceNumber: "asc" },
      include: {
        controlAssessments: {
          where: IN_SCOPE,
          select: { control: { select: { controlNumber: true } } },
          orderBy: { control: { controlNumber: "asc" } },
        },
      },
    }),
    prisma.controlAssessment.count({ where: { assessmentId: id, meetingId: null, ...IN_SCOPE } }),
    prisma.meeting.count({ where: { assessmentId: id, ...CLEARABLE_MEETING } }),
    prisma.meeting.findFirst({ where: { assessmentId: id }, orderBy: { scheduledAt: "desc" }, select: { scheduledAt: true } }),
  ]);

  // New meetings default to starting after the last kept meeting, or today.
  const defaultStart = lastMeeting ? new Date(lastMeeting.scheduledAt.getTime() + 14 * 24 * 60 * 60 * 1000) : new Date();
  const defaultStartDate = defaultStart.toISOString().slice(0, 10);

  const generateCard = (
    <Card>
      <CardHeader>
        <CardTitle>{meetings.length === 0 ? "Generate a schedule" : "Schedule remaining controls"}</CardTitle>
      </CardHeader>
      <CardContent>
        <GenerateScheduleForm
          assessmentId={id}
          unscheduledCount={unscheduledCount}
          defaultStartDate={defaultStartDate}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/assessments/${id}`} className="text-sm text-slate-500 hover:underline">
            ← Back to {assessment.name}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Meeting Schedule</h1>
          <p className="mt-1 text-sm text-slate-500">{assessment.organization.name}</p>
        </div>
        {meetings.length > 0 && (
          <div className="flex gap-2">
            {clearableCount > 0 && <ClearScheduleButton assessmentId={id} clearableCount={clearableCount} />}
            <Link
              href={`/assessments/${id}/meetings`}
              className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              List
            </Link>
            <Link
              href={`/assessments/${id}/meetings/calendar`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Calendar
            </Link>
          </div>
        )}
      </div>

      {meetings.length > 0 && unscheduledCount > 0 && generateCard}

      {meetings.length === 0 ? (
        generateCard
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Meetings ({meetings.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Controls</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-slate-600">{m.sequenceNumber}</TableCell>
                    <TableCell>
                      <Link
                        href={`/assessments/${id}/meetings/${m.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {formatDate(m.scheduledAt)}{" "}
                        {new Date(m.scheduledAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {m.controlAssessments.map((ca) => ca.control.controlNumber).join(", ")}
                    </TableCell>
                    <TableCell>
                      <MeetingStatusBadge status={m.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
