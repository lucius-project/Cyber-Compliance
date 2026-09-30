import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { IN_SCOPE, VISIBLE_MEETING } from "@/lib/scope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingStatusBadge } from "@/components/status-badges";
import { parseMonthParam, monthParam, addMonths, buildMonthGrid, toDateKey } from "@/lib/calendar";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function MeetingsCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month } = await searchParams;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { organization: { select: { name: true } } },
  });
  if (!assessment) notFound();

  const monthStart = parseMonthParam(month);
  const weeks = buildMonthGrid(monthStart);
  const gridStart = weeks[0][0].date;
  const gridEnd = weeks[weeks.length - 1][6].date;
  const gridEndExclusive = new Date(gridEnd);
  gridEndExclusive.setUTCDate(gridEndExclusive.getUTCDate() + 1);

  const meetings = await prisma.meeting.findMany({
    where: { assessmentId: id, scheduledAt: { gte: gridStart, lt: gridEndExclusive }, ...VISIBLE_MEETING },
    orderBy: { scheduledAt: "asc" },
    include: {
      controlAssessments: {
        where: IN_SCOPE,
        select: { control: { select: { controlNumber: true } } },
        orderBy: { control: { controlNumber: "asc" } },
      },
    },
  });

  const meetingsByDay = new Map<string, typeof meetings>();
  for (const m of meetings) {
    const key = toDateKey(new Date(m.scheduledAt));
    meetingsByDay.set(key, [...(meetingsByDay.get(key) ?? []), m]);
  }

  const monthLabel = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const today = toDateKey(new Date());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/assessments/${id}/meetings`} className="text-sm text-slate-500 hover:underline">
            ← Back to {assessment.name}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Meeting Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">{assessment.organization.name}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/assessments/${id}/meetings`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            List
          </Link>
          <Link
            href={`/assessments/${id}/meetings/calendar`}
            className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            Calendar
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{monthLabel}</CardTitle>
          <div className="flex gap-1">
            <Link
              href={`/assessments/${id}/meetings/calendar?month=${monthParam(addMonths(monthStart, -1))}`}
              className="flex size-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href={`/assessments/${id}/meetings/calendar?month=${monthParam(new Date())}`}
              className="flex items-center rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Today
            </Link>
            <Link
              href={`/assessments/${id}/meetings/calendar?month=${monthParam(addMonths(monthStart, 1))}`}
              className="flex size-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weeks.flat().map((cell) => {
              const dayMeetings = meetingsByDay.get(cell.key) ?? [];
              return (
                <div
                  key={cell.key}
                  className={`flex min-h-28 flex-col gap-1 border-b border-r border-slate-100 p-1.5 last:border-r-0 ${
                    cell.inMonth ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <span
                    className={`text-xs ${
                      cell.key === today
                        ? "flex size-5 items-center justify-center rounded-full bg-slate-900 font-semibold text-white"
                        : cell.inMonth
                          ? "text-slate-500"
                          : "text-slate-300"
                    }`}
                  >
                    {cell.date.getUTCDate()}
                  </span>
                  {dayMeetings.map((m) => (
                    <Link
                      key={m.id}
                      href={`/assessments/${id}/meetings/${m.id}`}
                      className="rounded-md border border-slate-200 bg-slate-50 p-1.5 text-xs hover:border-slate-400 hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium text-slate-900">#{m.sequenceNumber}</span>
                        <MeetingStatusBadge status={m.status} />
                      </div>
                      <p className="mt-0.5 truncate text-slate-600">
                        {m.controlAssessments.map((ca) => ca.control.controlNumber).join(", ")}
                      </p>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
