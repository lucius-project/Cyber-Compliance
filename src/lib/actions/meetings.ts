"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CLEARABLE_MEETING, IN_SCOPE } from "@/lib/scope";
import { recordAuditLog } from "@/lib/audit";
import { meetingScheduleSchema, meetingNotesSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/organizations";
import type { MeetingStatus } from "@prisma/client";

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export async function generateMeetingSchedule(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = meetingScheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { assessmentId, startDate, startTime, intervalDays, controlsPerMeeting } = parsed.data;

  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) return { error: "Assessment not found" };

  // Meetings kept by clearMeetingSchedule (held, cancelled, or with notes)
  // keep their numbers; new ones continue after them.
  const lastMeeting = await prisma.meeting.findFirst({
    where: { assessmentId },
    orderBy: { sequenceNumber: "desc" },
    select: { sequenceNumber: true },
  });
  const firstSequenceNumber = (lastMeeting?.sequenceNumber ?? 0) + 1;

  const unscheduled = await prisma.controlAssessment.findMany({
    where: { assessmentId, meetingId: null, ...IN_SCOPE },
    select: { id: true },
    orderBy: { control: { controlNumber: "asc" } },
  });
  if (unscheduled.length === 0) {
    return { error: "Every applicable control on this assessment is already in a meeting." };
  }

  const startAt = new Date(`${startDate}T${startTime}:00`);
  if (Number.isNaN(startAt.getTime())) {
    return { error: "Invalid start date/time" };
  }

  const groups = chunk(unscheduled, controlsPerMeeting);

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < groups.length; i++) {
      const scheduledAt = new Date(startAt.getTime() + i * intervalDays * 24 * 60 * 60 * 1000);
      const meeting = await tx.meeting.create({
        data: { assessmentId, sequenceNumber: firstSequenceNumber + i, scheduledAt },
      });
      await tx.controlAssessment.updateMany({
        where: { id: { in: groups[i].map((c) => c.id) } },
        data: { meetingId: meeting.id },
      });
    }
  });

  await recordAuditLog({
    entityType: "Assessment",
    entityId: assessmentId,
    action: "meeting_schedule_generated",
    newValue: { meetingCount: groups.length, firstSequenceNumber, controlsPerMeeting, intervalDays, startAt },
  });

  revalidatePath(`/assessments/${assessmentId}/meetings`);
  redirect(`/assessments/${assessmentId}/meetings`);
}

/**
 * Deletes an assessment's clearable meetings so the schedule can be
 * regenerated. Their controls become unscheduled (Meeting -> ControlAssessment
 * is onDelete: SetNull); completed/cancelled meetings and any with notes are
 * kept as history.
 */
export async function clearMeetingSchedule(assessmentId: string) {
  const meetings = await prisma.meeting.findMany({
    where: { assessmentId, ...CLEARABLE_MEETING },
    select: { id: true, sequenceNumber: true, scheduledAt: true },
  });
  if (meetings.length === 0) return;

  await prisma.meeting.deleteMany({ where: { id: { in: meetings.map((m) => m.id) } } });

  await recordAuditLog({
    entityType: "Assessment",
    entityId: assessmentId,
    action: "meeting_schedule_cleared",
    previousValue: { meetings },
    newValue: { deletedCount: meetings.length },
  });

  revalidatePath(`/assessments/${assessmentId}/meetings`, "layout");
  redirect(`/assessments/${assessmentId}/meetings`);
}

export async function updateMeetingStatus(meetingId: string, status: MeetingStatus) {
  const before = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!before) return;

  const meeting = await prisma.meeting.update({ where: { id: meetingId }, data: { status } });

  await recordAuditLog({
    entityType: "Meeting",
    entityId: meeting.id,
    action: "status_changed",
    previousValue: { status: before.status },
    newValue: { status: meeting.status },
  });

  revalidatePath(`/assessments/${meeting.assessmentId}/meetings`);
  revalidatePath(`/assessments/${meeting.assessmentId}/meetings/${meetingId}`);
}

export async function updateMeetingNotes(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = meetingNotesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { meetingId, notes } = parsed.data;

  const meeting = await prisma.meeting.update({ where: { id: meetingId }, data: { notes: notes ?? null } });

  revalidatePath(`/assessments/${meeting.assessmentId}/meetings/${meetingId}`);
  return {};
}
