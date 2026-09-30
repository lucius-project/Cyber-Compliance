"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import { createRemediationItem, updateRemediationItem } from "@/lib/actions/remediation";
import type { ActionResult } from "@/lib/actions/organizations";

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED", "ACCEPTED_RISK"] as const;

export function RemediationForm({
  organizations,
  fixedOrganizationId,
  controlAssessmentId,
  users,
  item,
}: {
  organizations?: { id: string; name: string }[];
  fixedOrganizationId?: string;
  controlAssessmentId?: string;
  users: { id: string; name: string }[];
  /** When given, the form edits this item instead of creating a new one. */
  item?: {
    id: string;
    title: string;
    description: string | null;
    ownerId: string | null;
    priority: string;
    status: string;
    dueDate: Date | null;
    notes: string | null;
  };
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    item ? updateRemediationItem.bind(null, item.id) : createRemediationItem,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {controlAssessmentId && <input type="hidden" name="controlAssessmentId" value={controlAssessmentId} />}
      <FormError message={state.error} />
      {state.message && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      {organizations ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="organizationId">
            Organization<span className="text-red-500"> *</span>
          </Label>
          <Select id="organizationId" name="organizationId" required defaultValue="">
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
      ) : (
        <input type="hidden" name="organizationId" value={fixedOrganizationId} />
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">
          Title<span className="text-red-500"> *</span>
        </Label>
        <Input id="title" name="title" required defaultValue={item?.title} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" name="priority" defaultValue={item?.priority ?? "MEDIUM"}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={item?.status ?? "OPEN"}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ownerId">Owner</Label>
          <Select id="ownerId" name="ownerId" defaultValue={item?.ownerId ?? ""}>
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
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          className="max-w-xs"
          defaultValue={item?.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : undefined}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} defaultValue={item?.description ?? undefined} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="remediationNotes">Notes</Label>
        <Textarea id="remediationNotes" name="notes" rows={2} defaultValue={item?.notes ?? undefined} />
      </div>

      <div>
        <SubmitButton size="sm">{item ? "Save Changes" : "Add Remediation Item"}</SubmitButton>
      </div>
    </form>
  );
}
