import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getOrganizationReadinessMap } from "@/lib/compliance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatPercent } from "@/lib/utils";

export default async function OrganizationsPage() {
  const [organizations, readinessMap] = await Promise.all([
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
    getOrganizationReadinessMap(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Organizations</h1>
          <p className="mt-1 text-sm text-slate-500">Client organizations tracked in Cyber Compliance.</p>
        </div>
        <Button asChild>
          <Link href="/organizations/new">
            <Plus /> New Organization
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {organizations.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Assessments</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => {
                  const readiness = readinessMap.get(org.id);
                  return (
                    <TableRow key={org.id}>
                      <TableCell>
                        <Link href={`/organizations/${org.id}`} className="font-medium text-slate-900 hover:underline">
                          {org.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-600">{org.industry ?? "—"}</TableCell>
                      <TableCell className="text-slate-600">{org.primaryContact ?? "—"}</TableCell>
                      <TableCell className="text-slate-600">{readiness?.assessmentCount ?? 0}</TableCell>
                      <TableCell className="text-slate-600">
                        {readiness?.readiness === null || readiness?.readiness === undefined
                          ? "Not assessed"
                          : formatPercent(readiness.readiness)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.isActive ? "success" : "outline"}>
                          {org.isActive ? "Active" : "Inactive"}
                        </Badge>
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <p className="text-sm font-medium text-slate-900">No organizations yet</p>
      <p className="text-sm text-slate-500">Add your first client organization to get started.</p>
      <Button asChild className="mt-2">
        <Link href="/organizations/new">
          <Plus /> New Organization
        </Link>
      </Button>
    </div>
  );
}
