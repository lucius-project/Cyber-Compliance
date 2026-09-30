"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import { createAssessment } from "@/lib/actions/assessments";
import type { ActionResult } from "@/lib/actions/organizations";

export function NewAssessmentForm({
  organizations,
  frameworks,
  users,
  defaultOrganizationId,
  defaultFrameworkIds,
}: {
  organizations: { id: string; name: string }[];
  frameworks: { id: string; name: string }[];
  users: { id: string; name: string }[];
  defaultOrganizationId?: string;
  /** The chosen organization's applied frameworks, pre-checked. */
  defaultFrameworkIds?: string[];
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(createAssessment, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError message={state.error} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="organizationId">
          Organization<span className="text-red-500"> *</span>
        </Label>
        <Select id="organizationId" name="organizationId" required defaultValue={defaultOrganizationId ?? ""}>
          <option value="" disabled>
            Select an organization
          </option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">
          Assessment Name<span className="text-red-500"> *</span>
        </Label>
        <Input id="name" name="name" required placeholder="e.g. Q1 2026 Annual Assessment" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>
          Frameworks Covered<span className="text-red-500"> *</span>
        </Label>
        <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
          {frameworks.length === 0 ? (
            <p className="text-sm text-slate-500">No frameworks configured yet.</p>
          ) : (
            frameworks.map((fw) => (
              <label key={fw.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="frameworkIds"
                  value={fw.id}
                  defaultChecked={defaultFrameworkIds?.includes(fw.id)}
                />
                {fw.name}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assessmentDate">Assessment Date</Label>
          <Input id="assessmentDate" name="assessmentDate" type="date" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assessorId">Assessor</Label>
          <Select id="assessorId" name="assessorId" defaultValue="">
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      <div>
        <SubmitButton>Create Assessment</SubmitButton>
      </div>
    </form>
  );
}
