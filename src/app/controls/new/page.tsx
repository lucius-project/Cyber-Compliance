"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import { createControl } from "@/lib/actions/controls";
import type { ActionResult } from "@/lib/actions/organizations";

export default function NewControlPage() {
  const [state, formAction] = useActionState<ActionResult, FormData>(createControl, {});

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Master Control</h1>
        <p className="mt-1 text-sm text-slate-500">
          Define a framework-agnostic control. Map it to framework requirements afterward.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Control Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <FormError message={state.error} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="controlNumber">
                  Control Number<span className="text-red-500"> *</span>
                </Label>
                <Input id="controlNumber" name="controlNumber" required placeholder="e.g. 100" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="e.g. Access Control" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">
                Name<span className="text-red-500"> *</span>
              </Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guidance">Guidance</Label>
              <Textarea id="guidance" name="guidance" rows={3} />
            </div>
            <div>
              <SubmitButton>Create Control</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
