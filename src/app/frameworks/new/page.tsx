"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import { createFramework } from "@/lib/actions/frameworks";
import type { ActionResult } from "@/lib/actions/organizations";

export default function NewFrameworkPage() {
  const [state, formAction] = useActionState<ActionResult, FormData>(createFramework, {});

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Framework</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a compliance framework. Requirements can be added on the framework page or via CSV
          import.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Framework Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <FormError message={state.error} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">
                Name<span className="text-red-500"> *</span>
              </Label>
              <Input id="name" name="name" required placeholder="e.g. Cyber Insurability 2025" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="version">Version</Label>
              <Input id="version" name="version" placeholder="e.g. 2025" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <div>
              <SubmitButton>Create Framework</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
