import { humanize, shortDate } from "@/lib/meeting-agenda";

export type EmailTask = {
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  owner: { name: string } | null;
  controlAssessment: { control: { controlNumber: string } } | null;
};

/** Plain-text email of a client's open remediation tasks, grouped by owner. */
export function buildTasksEmail(params: { orgName: string; tasks: EmailTask[]; today?: Date }): {
  subject: string;
  body: string;
} {
  const { orgName, tasks } = params;
  const today = params.today ?? new Date();

  const byOwner = new Map<string, EmailTask[]>();
  for (const task of tasks) {
    const owner = task.owner?.name ?? "Unassigned";
    byOwner.set(owner, [...(byOwner.get(owner) ?? []), task]);
  }
  // Named owners alphabetically, unassigned last.
  const owners = Array.from(byOwner.keys()).sort((a, b) =>
    a === "Unassigned" ? 1 : b === "Unassigned" ? -1 : a.localeCompare(b)
  );

  const subject = `Open tasks: ${orgName} Compliance Remediation (${shortDate(today)})`;
  const lines: string[] = [];
  lines.push(`Open remediation tasks for ${orgName} as of ${shortDate(today)} (${tasks.length} total).`);
  lines.push("");
  for (const owner of owners) {
    const ownerTasks = byOwner.get(owner)!;
    lines.push(`${owner} (${ownerTasks.length}):`);
    for (const task of ownerTasks) {
      const parts = [humanize(task.priority), humanize(task.status)];
      if (task.controlAssessment) parts.unshift(`Control ${task.controlAssessment.control.controlNumber}`);
      if (task.dueDate) {
        parts.push(`due ${shortDate(task.dueDate)}${task.dueDate < today ? " - OVERDUE" : ""}`);
      }
      lines.push(`  - ${task.title} (${parts.join(", ")})`);
    }
    lines.push("");
  }
  lines.push("Thanks,");
  lines.push("Lucius");

  return { subject, body: lines.join("\n") };
}
