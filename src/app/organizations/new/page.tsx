import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationForm } from "@/components/organizations/organization-form";
import { createOrganization } from "@/lib/actions/organizations";

export default function NewOrganizationPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Organization</h1>
        <p className="mt-1 text-sm text-slate-500">Add a client organization to track for compliance.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationForm action={createOrganization} />
        </CardContent>
      </Card>
    </div>
  );
}
