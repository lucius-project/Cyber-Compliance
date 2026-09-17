import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationForm } from "@/components/organizations/organization-form";
import { updateOrganization } from "@/lib/actions/organizations";

export default async function EditOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organization = await prisma.organization.findUnique({ where: { id } });
  if (!organization) notFound();

  const boundAction = updateOrganization.bind(null, organization.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Edit {organization.name}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationForm action={boundAction} organization={organization} submitLabel="Save Changes" />
        </CardContent>
      </Card>
    </div>
  );
}
