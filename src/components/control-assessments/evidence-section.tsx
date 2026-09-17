"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { FormError } from "@/components/form-error";
import { Badge } from "@/components/ui/badge";
import { createEvidence, deleteEvidence } from "@/lib/actions/evidence";
import type { ActionResult } from "@/lib/actions/organizations";
import type { Evidence, EvidenceType } from "@prisma/client";
import { formatDate } from "@/lib/utils";

const EVIDENCE_TYPE_OPTIONS: { value: EvidenceType; label: string }[] = [
  { value: "SCREENSHOT", label: "Screenshot" },
  { value: "POLICY", label: "Policy" },
  { value: "BACKUP_REPORT", label: "Backup Report" },
  { value: "VULNERABILITY_REPORT", label: "Vulnerability Report" },
  { value: "SECURITY_AWARENESS_REPORT", label: "Security Awareness Report" },
  { value: "CONFIGURATION_EXPORT", label: "Configuration Export" },
  { value: "TICKET", label: "Ticket" },
  { value: "EXTERNAL_URL", label: "External URL" },
  { value: "ASSESSMENT_DOCUMENT", label: "Assessment Document" },
  { value: "OTHER", label: "Other" },
];

export function EvidenceSection({
  controlAssessmentId,
  evidence,
}: {
  controlAssessmentId: string;
  evidence: (Evidence & { collectedBy: { name: string } | null })[];
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(createEvidence, {});

  return (
    <div className="flex flex-col gap-4">
      {evidence.length === 0 ? (
        <p className="text-sm text-slate-500">No evidence attached yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {evidence.map((item) => (
            <li key={item.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <Badge variant="secondary">
                      {EVIDENCE_TYPE_OPTIONS.find((o) => o.value === item.evidenceType)?.label}
                    </Badge>
                  </div>
                  {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
                  {item.externalUrl && (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-1 block truncate text-sm text-blue-600 hover:underline"
                    >
                      {item.externalUrl}
                    </a>
                  )}
                  {item.fileReference && (
                    <p className="mt-1 text-xs text-slate-500">File: {item.fileReference}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Collected {formatDate(item.dateCollected)}
                    {item.collectedBy ? ` by ${item.collectedBy.name}` : ""}
                    {item.reviewDate ? ` · review by ${formatDate(item.reviewDate)}` : ""}
                  </p>
                </div>
                <form action={deleteEvidence.bind(null, item.id)}>
                  <Button type="submit" variant="ghost" size="icon" aria-label="Delete evidence">
                    <Trash2 className="size-4 text-slate-400" />
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex flex-col gap-4 border-t border-slate-100 pt-4">
        <input type="hidden" name="controlAssessmentId" value={controlAssessmentId} />
        <FormError message={state.error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">
              Title<span className="text-red-500"> *</span>
            </Label>
            <Input id="title" name="title" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evidenceType">Type</Label>
            <Select id="evidenceType" name="evidenceType" defaultValue="OTHER">
              {EVIDENCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fileReference">File Reference</Label>
            <Input id="fileReference" name="fileReference" placeholder="e.g. filename or path" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="externalUrl">External URL</Label>
            <Input id="externalUrl" name="externalUrl" type="url" placeholder="https://..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dateCollected">Date Collected</Label>
            <Input id="dateCollected" name="dateCollected" type="date" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reviewDate">Review / Expiration Date</Label>
            <Input id="reviewDate" name="reviewDate" type="date" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="evidenceNotes">Notes</Label>
          <Textarea id="evidenceNotes" name="notes" rows={2} />
        </div>
        <div>
          <SubmitButton size="sm">Add Evidence</SubmitButton>
        </div>
      </form>
    </div>
  );
}
