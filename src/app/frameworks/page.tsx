import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function FrameworksPage() {
  const frameworks = await prisma.framework.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { requirements: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Frameworks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Compliance frameworks and their requirements. New frameworks can be added without any
            code changes.
          </p>
        </div>
        <Button asChild>
          <Link href="/frameworks/new">
            <Plus /> New Framework
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {frameworks.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-500">No frameworks yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Requirements</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {frameworks.map((fw) => (
                  <TableRow key={fw.id}>
                    <TableCell>
                      <Link href={`/frameworks/${fw.id}`} className="font-medium text-slate-900 hover:underline">
                        {fw.name}
                      </Link>
                      {fw.description && <p className="text-xs text-slate-500">{fw.description}</p>}
                    </TableCell>
                    <TableCell className="text-slate-600">{fw.version ?? "—"}</TableCell>
                    <TableCell className="text-slate-600">{fw._count.requirements}</TableCell>
                    <TableCell>
                      <Badge variant={fw.isActive ? "success" : "outline"}>
                        {fw.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
