"use client";

import { Button } from "@/components/ui/button";
import { clearMeetingSchedule } from "@/lib/actions/meetings";

export function ClearScheduleButton({ assessmentId, clearableCount }: { assessmentId: string; clearableCount: number }) {
  return (
    <form
      action={clearMeetingSchedule.bind(null, assessmentId)}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Delete ${clearableCount} upcoming meeting${clearableCount === 1 ? "" : "s"}? ` +
            "Their controls go back to unscheduled so you can generate a new schedule. " +
            "Completed or cancelled meetings and meetings with notes are kept."
        );
        if (!ok) e.preventDefault();
      }}
    >
      <Button type="submit" variant="outline" size="sm">
        Clear Schedule
      </Button>
    </form>
  );
}
