import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function SettingsPage() {
  const [users, auditLogCount] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.auditLog.count(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Application configuration. Full authentication and role-based access control are planned
          for a later phase.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "success" : "outline"}>
                      {user.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            {auditLogCount} audit log {auditLogCount === 1 ? "entry" : "entries"} recorded. Every
            control status change, evidence change, remediation change, and assessment change is
            logged with a before/after value.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles (Planned)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["ADMIN", "ASSESSOR", "TECHNICIAN", "CLIENT"].map((role) => (
            <Badge key={role} variant="outline">
              {role}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
