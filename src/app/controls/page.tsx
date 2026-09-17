import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { Prisma } from "@prisma/client";

export default async function ControlsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

  const where: Prisma.ControlWhereInput = {
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { controlNumber: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [controls, categories] = await Promise.all([
    prisma.control.findMany({
      where,
      orderBy: { controlNumber: "asc" },
      include: { frameworkMappings: { include: { frameworkRequirement: { include: { framework: true } } } } },
    }),
    prisma.control.findMany({
      where: { category: { not: null } },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Master Controls</h1>
          <p className="mt-1 text-sm text-slate-500">
            Framework-agnostic control library. Each control can map to requirements in multiple
            frameworks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/controls/import">
              <Upload /> Import CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/controls/new">
              <Plus /> New Control
            </Link>
          </Button>
        </div>
      </div>

      <form className="flex flex-wrap gap-3" action="/controls">
        <Input name="q" defaultValue={q} placeholder="Search by control number or name..." className="max-w-sm" />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category ?? ""}>
              {c.category}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <Card>
        <CardContent className="p-0">
          {controls.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-500">
              No controls found. Create one or import from CSV.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Frameworks</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {controls.map((control) => {
                  const frameworkNames = Array.from(
                    new Set(control.frameworkMappings.map((m) => m.frameworkRequirement.framework.name))
                  );
                  return (
                    <TableRow key={control.id}>
                      <TableCell>
                        <Link href={`/controls/${control.id}`} className="font-medium text-slate-900 hover:underline">
                          {control.controlNumber} · {control.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-600">{control.category ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {frameworkNames.length === 0 ? (
                            <span className="text-slate-400">Unmapped</span>
                          ) : (
                            frameworkNames.map((name) => (
                              <Badge key={name} variant="secondary">
                                {name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={control.isDeprecated ? "outline" : "success"}>
                          {control.isDeprecated ? "Deprecated" : "Active"}
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
