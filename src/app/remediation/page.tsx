import Link from "next/link";
import { Mail, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RemediationPriorityBadge, RemediationStatusBadge } from "@/components/status-badges";
import { MarkDoneButton } from "@/components/remediation/mark-done-button";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import { OPEN_REMEDIATION_STATUSES } from "@/lib/meeting-agenda";
import { buildTasksEmail } from "@/lib/task-email";
import type { Prisma, RemediationPriority, RemediationStatus } from "@prisma/client";

export default async function RemediationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; organizationId?: string }>;
}) {
  const { status, priority, organizationId } = await searchParams;

  const where: Prisma.RemediationItemWhereInput = {
    ...(organizationId ? { organizationId } : {}),
    ...(status ? { status: status as RemediationStatus } : {}),
    ...(priority ? { priority: priority as RemediationPriority } : {}),
  };

  const [items, organizations] = await Promise.all([
    prisma.remediationItem.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        organization: { select: { id: true, name: true } },
        owner: { select: { name: true, email: true } },
        controlAssessment: { select: { control: { select: { controlNumber: true } } } },
      },
    }),
    prisma.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // Emailing tasks needs one client: its open tasks (within the current
  // filters) go to the client's people, its assessors, and the task owners.
  const selectedOrg = organizations.find((o) => o.id === organizationId);
  const openItems = items.filter((i) => (OPEN_REMEDIATION_STATUSES as readonly string[]).includes(i.status));
  let tasksMailtoHref: string | null = null;
  let taskRecipients: string[] = [];
  if (selectedOrg && openItems.length > 0) {
    const [people, assessments] = await Promise.all([
      prisma.user.findMany({ where: { organizationId: selectedOrg.id, active: true }, select: { email: true } }),
      prisma.assessment.findMany({
        where: { organizationId: selectedOrg.id, assessorId: { not: null } },
        select: { assessor: { select: { email: true } } },
      }),
    ]);
    const systemEmail = process.env.SEED_SYSTEM_USER_EMAIL ?? "system@cyber-compliance.local";
    taskRecipients = Array.from(
      new Set(
        [
          ...assessments.map((a) => a.assessor?.email),
          ...people.map((p) => p.email),
          ...openItems.map((i) => i.owner?.email),
        ].filter((email): email is string => Boolean(email) && email !== systemEmail)
      )
    );
    const { subject, body } = buildTasksEmail({ orgName: selectedOrg.name, tasks: openItems });
    tasksMailtoHref = `mailto:${taskRecipients.map(encodeURIComponent).join(",")}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Remediation</h1>
          <p className="mt-1 text-sm text-slate-500">Open items across all client organizations.</p>
        </div>
        <div className="flex gap-2">
          {tasksMailtoHref && (
            <Button asChild variant="outline">
              <a href={tasksMailtoHref} title={`To: ${taskRecipients.join(", ")}`}>
                <Mail /> Email {openItems.length} open task{openItems.length === 1 ? "" : "s"}
              </a>
            </Button>
          )}
          <Button asChild>
            <Link href="/remediation/new">
              <Plus /> New Remediation Item
            </Link>
          </Button>
        </div>
      </div>

      <form className="flex flex-wrap gap-3" action="/remediation">
        <Select name="organizationId" defaultValue={organizationId ?? ""} className="w-56">
          <option value="">All organizations</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status ?? ""} className="w-48">
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="COMPLETED">Completed</option>
          <option value="ACCEPTED_RISK">Accepted Risk</option>
        </Select>
        <Select name="priority" defaultValue={priority ?? ""} className="w-48">
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </Select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {!selectedOrg && (
          <p className="self-center text-sm text-slate-500">Choose an organization to email its open tasks.</p>
        )}
      </form>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-500">No remediation items match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const overdue = isOverdue(item.dueDate, item.status);
                  return (
                    <TableRow key={item.id} className={cn(overdue && "bg-red-50/60")}>
                      <TableCell>
                        <Link href={`/remediation/${item.id}`} className="font-medium text-slate-900 hover:underline">
                          {item.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/organizations/${item.organization.id}`} className="text-slate-600 hover:underline">
                          {item.organization.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-600">{item.owner?.name ?? "Unassigned"}</TableCell>
                      <TableCell>
                        <RemediationPriorityBadge priority={item.priority} />
                      </TableCell>
                      <TableCell>
                        <RemediationStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className={cn("text-slate-600", overdue && "font-medium text-red-700")}>
                        {formatDate(item.dueDate)}
                        {overdue && " (overdue)"}
                      </TableCell>
                      <TableCell className="text-right">
                        <MarkDoneButton remediationId={item.id} status={item.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
