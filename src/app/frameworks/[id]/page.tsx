import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function FrameworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const framework = await prisma.framework.findUnique({
    where: { id },
    include: {
      requirements: {
        orderBy: { code: "asc" },
        include: { mappings: { include: { control: true } } },
      },
    },
  });

  if (!framework) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">{framework.name}</h1>
          {framework.version && <Badge variant="secondary">{framework.version}</Badge>}
        </div>
        {framework.description && <p className="mt-1 text-sm text-slate-500">{framework.description}</p>}
      </div>

      <Card>
        <CardContent className="p-0">
          {framework.requirements.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-500">
              No requirements yet. Add them via the Controls CSV import.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Mapped Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {framework.requirements.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="align-top">
                      <p className="font-medium text-slate-900">{req.code}</p>
                      {req.title && <p className="text-xs text-slate-500">{req.title}</p>}
                    </TableCell>
                    <TableCell>
                      {req.mappings.length === 0 ? (
                        <span className="text-slate-400">No controls mapped</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {req.mappings.map((m) => (
                            <Link key={m.id} href={`/controls/${m.control.id}`}>
                              <Badge variant="outline">
                                {m.control.controlNumber} · {m.control.name}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}
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
