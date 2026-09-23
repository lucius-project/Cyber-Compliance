"use client";

import { useActionState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import { updateMeetingNotes } from "@/lib/actions/meetings";
import type { ActionResult } from "@/lib/actions/organizations";

export function MeetingNotesForm({ meetingId, notes }: { meetingId: string; notes: string | null }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(updateMeetingNotes, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <FormError message={state.error} />
      <input type="hidden" name="meetingId" value={meetingId} />
      <Textarea name="notes" rows={4} defaultValue={notes ?? ""} placeholder="What happened in this meeting..." />
      <div>
        <SubmitButton size="sm">Save Notes</SubmitButton>
      </div>
    </form>
  );
}
