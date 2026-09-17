import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/compliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatPercent } from "@/lib/utils";

export default async function FrameworkComplianceReportPage() {
  const [data, frameworks] = await Promise.all([
    getDashboardData(),
    prisma.framework.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { requirements: true } } },
    }),
  ]);

  const requirementCounts = new Map(frameworks.map((f) => [f.id, f._count.requirements]));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <Link href="/reports" className="text-sm text-slate-500 hover:underline">
          ← Reports
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Framework Compliance Report</h1>
        <p className="mt-1 text-sm text-slate-500">
          Current readiness per framework, aggregated across each organization&apos;s latest
          assessment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frameworks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Framework</TableHead>
                <TableHead>Requirements</TableHead>
                <TableHead>Implemented</TableHead>
                <TableHead>In Progress</TableHead>
                <TableHead>Not Started</TableHead>
                <TableHead>Not Assessed</TableHead>
                <TableHead>Readiness</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byFramework.map((fw) => (
                <TableRow key={fw.id}>
                  <TableCell>
                    <Link href={`/frameworks/${fw.id}`} className="font-medium text-slate-900 hover:underline">
                      {fw.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600">{requirementCounts.get(fw.id) ?? 0}</TableCell>
                  <TableCell className="text-slate-600">{fw.counts.IMPLEMENTED}</TableCell>
                  <TableCell className="text-slate-600">{fw.counts.IN_PROGRESS}</TableCell>
                  <TableCell className="text-slate-600">{fw.counts.NOT_STARTED}</TableCell>
                  <TableCell className="text-slate-600">{fw.counts.NOT_ASSESSED}</TableCell>
                  <TableCell className="font-medium text-slate-900">{formatPercent(fw.readiness)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
