"use client";

import { useActionState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import { addOrganizationPerson, type ActionResult } from "@/lib/actions/organizations";

export function AddPersonForm({ organizationId }: { organizationId: string }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    addOrganizationPerson.bind(null, organizationId),
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a successful add so the next person can be entered.
  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <FormError message={state.error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="person-name">
            Name<span className="text-red-500"> *</span>
          </Label>
          <Input id="person-name" name="name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="person-email">
            Email<span className="text-red-500"> *</span>
          </Label>
          <Input id="person-email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="person-title">Title</Label>
          <Input id="person-title" name="title" placeholder="e.g. IT Manager" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="person-role">Role</Label>
          <Select id="person-role" name="role" defaultValue="CLIENT">
            <option value="CLIENT">Client</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="ASSESSOR">Assessor</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>
      </div>
      <div>
        <SubmitButton size="sm">Add Person</SubmitButton>
      </div>
    </form>
  );
}
