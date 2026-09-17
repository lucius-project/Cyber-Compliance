import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RemediationPriorityBadge, RemediationStatusBadge } from "@/components/status-badges";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import type { Prisma, RemediationPriority, RemediationStatus } from "@prisma/client";

export default async function RemediationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const { status, priority } = await searchParams;

  const where: Prisma.RemediationItemWhereInput = {
    ...(status ? { status: status as RemediationStatus } : {}),
    ...(priority ? { priority: priority as RemediationPriority } : {}),
  };

  const items = await prisma.remediationItem.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: { organization: { select: { id: true, name: true } }, owner: { select: { name: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Remediation</h1>
          <p className="mt-1 text-sm text-slate-500">Open items across all client organizations.</p>
        </div>
        <Button asChild>
          <Link href="/remediation/new">
            <Plus /> New Remediation Item
          </Link>
        </Button>
      </div>

      <form className="flex flex-wrap gap-3" action="/remediation">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const overdue = isOverdue(item.dueDate, item.status);
                  return (
                    <TableRow key={item.id} className={cn(overdue && "bg-red-50/60")}>
                      <TableCell className="font-medium text-slate-900">{item.title}</TableCell>
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
