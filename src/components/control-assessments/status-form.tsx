"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import { updateControlAssessment } from "@/lib/actions/assessments";
import type { ActionResult } from "@/lib/actions/organizations";
import type { ControlAssessmentStatus } from "@prisma/client";

const STATUS_OPTIONS: { value: ControlAssessmentStatus; label: string }[] = [
  { value: "NOT_ASSESSED", label: "Not Assessed" },
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IMPLEMENTED", label: "Implemented" },
  { value: "NOT_APPLICABLE", label: "Not Applicable" },
];

function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function ControlAssessmentStatusForm({
  controlAssessment,
  users,
}: {
  controlAssessment: {
    id: string;
    status: ControlAssessmentStatus;
    isApplicable: boolean;
    ownerId: string | null;
    assessorId: string | null;
    notes: string | null;
    lastReviewedAt: Date | null;
    nextReviewAt: Date | null;
  };
  users: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(updateControlAssessment, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="controlAssessmentId" value={controlAssessment.id} />
      <FormError message={state.error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={controlAssessment.status}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
          <input type="checkbox" name="isApplicable" defaultChecked={controlAssessment.isApplicable} />
          Applicable to this organization
        </label>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ownerId">Owner</Label>
          <Select id="ownerId" name="ownerId" defaultValue={controlAssessment.ownerId ?? ""}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assessorId">Assessor</Label>
          <Select id="assessorId" name="assessorId" defaultValue={controlAssessment.assessorId ?? ""}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastReviewedAt">Last Reviewed</Label>
          <Input
            id="lastReviewedAt"
            name="lastReviewedAt"
            type="date"
            defaultValue={toDateInputValue(controlAssessment.lastReviewedAt)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nextReviewAt">Next Review</Label>
          <Input
            id="nextReviewAt"
            name="nextReviewAt"
            type="date"
            defaultValue={toDateInputValue(controlAssessment.nextReviewAt)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={controlAssessment.notes ?? undefined} />
      </div>

      <div>
        <SubmitButton>Save Assessment</SubmitButton>
      </div>
    </form>
  );
}
