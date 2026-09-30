/**
 * Standard prep checklist for a control being covered in a meeting. Always
 * derived at render time from the control - nothing here is persisted, so
 * there's no separate model to keep in sync with control/status changes.
 */
export function actionItemsForControl(control: { controlNumber: string; name: string }): string[] {
  return [
    `Review current implementation status of ${control.controlNumber} · ${control.name}`,
    "Confirm or assign an owner responsible for this control",
    "Gather and attach supporting evidence",
    "Note any gaps and open remediation items as needed",
    "Update status and notes in Cyber Compliance",
  ];
}

export const OPEN_REMEDIATION_STATUSES = ["OPEN", "IN_PROGRESS", "BLOCKED"] as const;

export function humanize(value: string): string {
  const s = value.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function shortDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export type TodoControl = {
  status: string;
  owner: { name: string } | null;
  evidenceCount: number;
  control: { controlNumber: string; name: string };
  remediationItems: { title: string; status: string; priority: string; dueDate: Date | null; owner: { name: string } | null }[];
};

/**
 * Follow-up to-dos for one control, from its current state rather than the
 * generic prep checklist: only asks for an owner/evidence when missing, and
 * lists open remediation items with who has them and when they're due.
 */
export function todosForControl(ca: TodoControl): string[] {
  const todos: string[] = [];
  if (!ca.owner) todos.push("Assign an owner for this control");
  if (ca.evidenceCount === 0) todos.push("Gather and attach supporting evidence");
  for (const item of ca.remediationItems) {
    if (!(OPEN_REMEDIATION_STATUSES as readonly string[]).includes(item.status)) continue;
    const parts = [humanize(item.priority), humanize(item.status), item.owner?.name ?? "unassigned"];
    if (item.dueDate) parts.push(`due ${shortDate(item.dueDate)}`);
    todos.push(`${item.title} (${parts.join(", ")})`);
  }
  if (ca.status !== "IMPLEMENTED" && ca.status !== "NOT_APPLICABLE") {
    todos.push("Update status and notes in Cyber Compliance");
  }
  return todos;
}

/** Plain-text to-do email for a meeting, sent to the assessor and the client's people. */
export function buildTodoEmail(params: {
  orgName: string;
  sequenceNumber: number;
  scheduledAt: Date;
  controls: TodoControl[];
  meetingNotes: string | null;
}): { subject: string; body: string } {
  const { orgName, sequenceNumber, scheduledAt, controls, meetingNotes } = params;
  const dateStr = shortDate(scheduledAt);
  const subject = `To-do: ${orgName} Compliance Review - Meeting #${sequenceNumber} (${dateStr})`;

  const lines: string[] = [];
  lines.push(`To-do list from compliance review meeting #${sequenceNumber} on ${dateStr}.`);
  lines.push("");
  for (const ca of controls) {
    lines.push(`${ca.control.controlNumber} - ${ca.control.name}`);
    lines.push(`Status: ${humanize(ca.status)} | Owner: ${ca.owner?.name ?? "unassigned"}`);
    const todos = todosForControl(ca);
    if (todos.length === 0) lines.push("  - Nothing outstanding");
    for (const todo of todos) lines.push(`  - ${todo}`);
    lines.push("");
  }
  if (meetingNotes?.trim()) {
    lines.push("Meeting notes:");
    lines.push(meetingNotes.trim());
    lines.push("");
  }
  lines.push("Thanks,");
  lines.push("Lucius");

  return { subject, body: lines.join("\n") };
}
