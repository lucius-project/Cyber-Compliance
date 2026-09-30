import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RemediationForm } from "@/components/remediation/remediation-form";

export default async function NewRemediationPage() {
  const [organizations, people] = await Promise.all([
    prisma.organization.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, organization: { select: { name: true } } },
    }),
  ]);
  const users = people.map((p) => ({
    id: p.id,
    name: p.organization ? `${p.name} (${p.organization.name})` : p.name,
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Remediation Item</h1>
        <p className="mt-1 text-sm text-slate-500">
          To link this item to a specific control, open that control from an assessment and add it
          there instead.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Remediation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <RemediationForm organizations={organizations} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
