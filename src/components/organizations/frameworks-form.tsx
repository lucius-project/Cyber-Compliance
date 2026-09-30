"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import { setOrganizationFrameworks, type ActionResult } from "@/lib/actions/organizations";

export function OrganizationFrameworksForm({
  organizationId,
  frameworks,
  appliedFrameworkIds,
}: {
  organizationId: string;
  frameworks: { id: string; name: string; controlCount: number }[];
  appliedFrameworkIds: string[];
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    setOrganizationFrameworks.bind(null, organizationId),
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state.error} />
      {state.message && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {frameworks.map((fw) => (
          <label key={fw.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="frameworkIds"
              value={fw.id}
              defaultChecked={appliedFrameworkIds.includes(fw.id)}
            />
            <span className="font-medium">{fw.name}</span>
            <span className="text-slate-400">· {fw.controlCount} controls</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Open assessments for this client only show controls mapped to the checked frameworks.
        Unchecking a framework hides its controls but keeps their status, evidence and remediation,
        and checking it again brings them back. Completed and archived assessments are not changed.
      </p>
      <div>
        <SubmitButton size="sm">Save Frameworks</SubmitButton>
      </div>
    </form>
  );
}
