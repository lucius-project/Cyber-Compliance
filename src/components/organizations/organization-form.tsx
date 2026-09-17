"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import type { ActionResult } from "@/lib/actions/organizations";
import type { Organization } from "@prisma/client";

type OrganizationAction = (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;

export function OrganizationForm({
  action,
  organization,
  submitLabel = "Create Organization",
}: {
  action: OrganizationAction;
  organization?: Organization;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError message={state.error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required defaultValue={organization?.name} />
        <Field label="Legal Name" name="legalName" defaultValue={organization?.legalName ?? undefined} />
        <Field
          label="Primary Contact"
          name="primaryContact"
          defaultValue={organization?.primaryContact ?? undefined}
        />
        <Field label="Email" name="email" type="email" defaultValue={organization?.email ?? undefined} />
        <Field label="Phone" name="phone" defaultValue={organization?.phone ?? undefined} />
        <Field label="Industry" name="industry" defaultValue={organization?.industry ?? undefined} />
        <Field
          label="Employee Count"
          name="employeeCount"
          type="number"
          defaultValue={organization?.employeeCount ?? undefined}
        />
        <Field
          label="Endpoint Count"
          name="endpointCount"
          type="number"
          defaultValue={organization?.endpointCount ?? undefined}
        />
        <Field
          label="Server Count"
          name="serverCount"
          type="number"
          defaultValue={organization?.serverCount ?? undefined}
        />
        <Field label="Location" name="location" defaultValue={organization?.location ?? undefined} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={organization?.notes ?? undefined} />
      </div>

      {organization && (
        <label className="flex w-fit items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isActive" defaultChecked={organization.isActive} />
          Active
        </label>
      )}

      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} />
    </div>
  );
}
