import { Badge } from "@/components/ui/badge";
import type {
  ControlAssessmentStatus,
  RemediationStatus,
  RemediationPriority,
  AssessmentStatus,
} from "@prisma/client";

const CONTROL_STATUS_LABEL: Record<ControlAssessmentStatus, string> = {
  NOT_ASSESSED: "Not Assessed",
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  IMPLEMENTED: "Implemented",
  NOT_APPLICABLE: "Not Applicable",
};

const CONTROL_STATUS_VARIANT: Record<
  ControlAssessmentStatus,
  "secondary" | "warning" | "info" | "success" | "outline"
> = {
  NOT_ASSESSED: "secondary",
  NOT_STARTED: "warning",
  IN_PROGRESS: "info",
  IMPLEMENTED: "success",
  NOT_APPLICABLE: "outline",
};

export function ControlAssessmentStatusBadge({ status }: { status: ControlAssessmentStatus }) {
  return <Badge variant={CONTROL_STATUS_VARIANT[status]}>{CONTROL_STATUS_LABEL[status]}</Badge>;
}

const REMEDIATION_STATUS_LABEL: Record<RemediationStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
  ACCEPTED_RISK: "Accepted Risk",
};

const REMEDIATION_STATUS_VARIANT: Record<
  RemediationStatus,
  "secondary" | "warning" | "info" | "success" | "outline" | "destructive"
> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  BLOCKED: "destructive",
  COMPLETED: "success",
  ACCEPTED_RISK: "outline",
};

export function RemediationStatusBadge({ status }: { status: RemediationStatus }) {
  return (
    <Badge variant={REMEDIATION_STATUS_VARIANT[status]}>{REMEDIATION_STATUS_LABEL[status]}</Badge>
  );
}

const PRIORITY_LABEL: Record<RemediationPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const PRIORITY_VARIANT: Record<RemediationPriority, "secondary" | "warning" | "destructive" | "outline"> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "warning",
  CRITICAL: "destructive",
};

export function RemediationPriorityBadge({ priority }: { priority: RemediationPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}

const ASSESSMENT_STATUS_LABEL: Record<AssessmentStatus, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const ASSESSMENT_STATUS_VARIANT: Record<AssessmentStatus, "secondary" | "info" | "success" | "outline"> = {
  DRAFT: "secondary",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  ARCHIVED: "outline",
};

export function AssessmentStatusBadge({ status }: { status: AssessmentStatus }) {
  return <Badge variant={ASSESSMENT_STATUS_VARIANT[status]}>{ASSESSMENT_STATUS_LABEL[status]}</Badge>;
}
