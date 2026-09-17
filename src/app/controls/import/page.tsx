"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import { Badge } from "@/components/ui/badge";
import { importControlsCsv, type ImportState } from "@/lib/actions/import";

export default function ImportControlsPage() {
  const [state, formAction] = useActionState<ImportState, FormData>(importControlsCsv, {});

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Import Controls</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload a CSV of master controls and their framework mappings. A control number that
          repeats across rows is recognized as the same control with multiple framework mappings —
          it is never duplicated.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV Format</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <p className="mb-2">Required columns: <code className="rounded bg-slate-100 px-1">control_number</code>, <code className="rounded bg-slate-100 px-1">control_name</code></p>
          <p className="mb-2">Optional columns: <code className="rounded bg-slate-100 px-1">description</code>, <code className="rounded bg-slate-100 px-1">category</code>, <code className="rounded bg-slate-100 px-1">deprecated</code>, <code className="rounded bg-slate-100 px-1">framework</code>, <code className="rounded bg-slate-100 px-1">framework_requirement</code></p>
          <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
{`control_number,control_name,description,category,framework,framework_requirement
100,Unique complex passwords,Require unique complex passwords...,Access Control,CIS v8,5.2
100,Unique complex passwords,Require unique complex passwords...,Access Control,Cyber Insurability 2025,AP-1
100,Unique complex passwords,Require unique complex passwords...,Access Control,PIPEDA,4.7.3`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <FormError message={state.error} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="file">CSV file</Label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".csv,text/csv"
                required
                className="text-sm"
              />
            </div>
            <div>
              <SubmitButton>Import</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      {state.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Import Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SummaryStat label="Rows Processed" value={state.summary.rowsProcessed} />
              <SummaryStat label="Controls Created" value={state.summary.controlsCreated} />
              <SummaryStat label="Controls Existing" value={state.summary.controlsExisting} />
              <SummaryStat label="Frameworks Created" value={state.summary.frameworksCreated} />
              <SummaryStat label="Requirements Created" value={state.summary.requirementsCreated} />
              <SummaryStat label="Mappings Created" value={state.summary.mappingsCreated} />
              <SummaryStat label="Mappings Already Existed" value={state.summary.mappingsAlreadyExisted} />
              <SummaryStat label="Errors" value={state.summary.errors.length} warn={state.summary.errors.length > 0} />
            </div>

            {state.summary.errors.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                <p className="text-sm font-medium text-slate-900">Row errors</p>
                <ul className="flex flex-col gap-1 text-sm text-slate-600">
                  {state.summary.errors.map((err, idx) => (
                    <li key={idx}>
                      <Badge variant="destructive">Row {err.row}</Badge> {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryStat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${warn ? "text-red-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
