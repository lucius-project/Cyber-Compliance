import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapControlToRequirement, toggleControlDeprecated } from "@/lib/actions/controls";

export default async function ControlDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [control, frameworks] = await Promise.all([
    prisma.control.findUnique({
      where: { id },
      include: {
        frameworkMappings: { include: { frameworkRequirement: { include: { framework: true } } } },
      },
    }),
    prisma.framework.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { requirements: { orderBy: { code: "asc" } } },
    }),
  ]);

  if (!control) notFound();

  const mappedRequirementIds = new Set(control.frameworkMappings.map((m) => m.frameworkRequirementId));
  const addMapping = mapControlToRequirement.bind(null, control.id);
  const toggleDeprecated = toggleControlDeprecated.bind(null, control.id, !control.isDeprecated);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              {control.controlNumber} · {control.name}
            </h1>
            <Badge variant={control.isDeprecated ? "outline" : "success"}>
              {control.isDeprecated ? "Deprecated" : "Active"}
            </Badge>
          </div>
          {control.category && <p className="mt-1 text-sm text-slate-500">{control.category}</p>}
        </div>
        <form action={toggleDeprecated}>
          <Button type="submit" variant="outline" size="sm">
            {control.isDeprecated ? "Reactivate" : "Mark Deprecated"}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {control.description || "No description provided."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {control.guidance || "No guidance provided."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Framework Mappings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {control.frameworkMappings.length === 0 ? (
            <p className="text-sm text-slate-500">Not mapped to any framework requirement yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {control.frameworkMappings.map((m) => (
                <li key={m.id}>
                  <Badge variant="secondary">
                    {m.frameworkRequirement.framework.name} → {m.frameworkRequirement.code}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <form action={addMapping} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="frameworkRequirementId">
                Add mapping
              </label>
              <select
                id="frameworkRequirementId"
                name="frameworkRequirementId"
                required
                className="h-9 min-w-64 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm"
              >
                {frameworks.map((fw) => (
                  <optgroup key={fw.id} label={fw.name}>
                    {fw.requirements.map((req) => (
                      <option key={req.id} value={req.id} disabled={mappedRequirementIds.has(req.id)}>
                        {req.code}
                        {req.title ? ` — ${req.title}` : ""}
                        {mappedRequirementIds.has(req.id) ? " (already mapped)" : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm">
              Map
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
