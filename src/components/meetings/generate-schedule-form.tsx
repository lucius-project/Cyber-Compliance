"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import { generateMeetingSchedule } from "@/lib/actions/meetings";
import type { ActionResult } from "@/lib/actions/organizations";

export function GenerateScheduleForm({
  assessmentId,
  unscheduledCount,
}: {
  assessmentId: string;
  unscheduledCount: number;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(generateMeetingSchedule, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError message={state.error} />
      <input type="hidden" name="assessmentId" value={assessmentId} />

      <p className="text-sm text-slate-600">
        Splits the {unscheduledCount} controls not yet assigned to a meeting into batches, one meeting per
        batch, spaced evenly from the start date.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">
            First meeting date<span className="text-red-500"> *</span>
          </Label>
          <Input id="startDate" name="startDate" type="date" defaultValue="2026-09-29" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startTime">
            Time<span className="text-red-500"> *</span>
          </Label>
          <Input id="startTime" name="startTime" type="time" defaultValue="15:00" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="intervalDays">Days between meetings</Label>
          <Input id="intervalDays" name="intervalDays" type="number" min={1} defaultValue={14} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="controlsPerMeeting">Controls per meeting</Label>
          <Input id="controlsPerMeeting" name="controlsPerMeeting" type="number" min={1} defaultValue={3} />
        </div>
      </div>

      <div>
        <SubmitButton>Generate Schedule</SubmitButton>
      </div>
    </form>
  );
}
