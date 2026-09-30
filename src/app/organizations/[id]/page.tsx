import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateReadiness, emptyStatusCounts } from "@/lib/compliance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AssessmentStatusBadge, RemediationPriorityBadge, RemediationStatusBadge } from "@/components/status-badges";
import { AddPersonForm } from "@/components/organizations/add-person-form";
import { formatDate, formatPercent } from "@/lib/utils";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      assessments: {
        orderBy: [{ assessmentDate: "desc" }, { createdAt: "desc" }],
        include: {
          frameworks: { include: { framework: true } },
          controlAssessments: { select: { status: true } },
        },
      },
      remediationItems: {
        orderBy: { createdAt: "desc" },
        include: { owner: { select: { name: true } } },
      },
      people: {
        orderBy: { name: "asc" },
        include: { _count: { select: { remediationItemsOwned: true, controlAssessmentsOwned: true } } },
      },
    },
  });

  if (!organization) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">{organization.name}</h1>
            <Badge variant={organization.isActive ? "success" : "outline"}>
              {organization.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {organization.industry ?? "Industry not set"} · {organization.location ?? "Location not set"}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/organizations/${organization.id}/edit`}>
            <Pencil /> Edit
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="remediation">Remediation</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Detail label="Legal Name" value={organization.legalName} />
                <Detail label="Primary Contact" value={organization.primaryContact} />
                <Detail label="Email" value={organization.email} />
                <Detail label="Phone" value={organization.phone} />
                <Detail label="Employees" value={organization.employeeCount?.toString()} />
                <Detail label="Endpoints" value={organization.endpointCount?.toString()} />
                <Detail label="Servers" value={organization.serverCount?.toString()} />
                <Detail label="Created" value={formatDate(organization.createdAt)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {organization.notes || "No notes yet."}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assessments">
          <div className="mb-3 flex justify-end">
            <Button asChild size="sm">
              <Link href={`/assessments/new?organizationId=${organization.id}`}>
                <Plus /> New Assessment
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {organization.assessments.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">
                  No assessments yet for this organization.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Frameworks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Readiness</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organization.assessments.map((assessment) => {
                      const counts = emptyStatusCounts();
                      for (const ca of assessment.controlAssessments) counts[ca.status]++;
                      return (
                        <TableRow key={assessment.id}>
                          <TableCell>
                            <Link
                              href={`/assessments/${assessment.id}`}
                              className="font-medium text-slate-900 hover:underline"
                            >
                              {assessment.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            <div className="flex flex-wrap gap-1">
                              {assessment.frameworks.map((af) => (
                                <Badge key={af.id} variant="secondary">
                                  {af.framework.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <AssessmentStatusBadge status={assessment.status} />
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {formatPercent(calculateReadiness(counts))}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {formatDate(assessment.assessmentDate ?? assessment.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remediation">
          <Card>
            <CardContent className="p-0">
              {organization.remediationItems.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">
                  No remediation items for this organization.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organization.remediationItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-slate-900">{item.title}</TableCell>
                        <TableCell className="text-slate-600">{item.owner?.name ?? "Unassigned"}</TableCell>
                        <TableCell>
                          <RemediationPriorityBadge priority={item.priority} />
                        </TableCell>
                        <TableCell>
                          <RemediationStatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className="text-slate-600">{formatDate(item.dueDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="people">
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="p-0">
                {organization.people.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-slate-500">
                    No people added for this organization yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Assigned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organization.people.map((person) => (
                        <TableRow key={person.id}>
                          <TableCell className="font-medium text-slate-900">{person.name}</TableCell>
                          <TableCell className="text-slate-600">{person.title ?? "—"}</TableCell>
                          <TableCell className="text-slate-600">{person.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{person.role}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {person._count.controlAssessmentsOwned} controls · {person._count.remediationItemsOwned}{" "}
                            remediation
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Add Person</CardTitle>
              </CardHeader>
              <CardContent>
                <AddPersonForm organizationId={organization.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-slate-800">{value || "—"}</p>
    </div>
  );
}
