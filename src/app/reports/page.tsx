import Link from "next/link";
import { FileText, ShieldCheck, Layers, ClipboardList, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const REPORTS = [
  {
    href: "/reports/executive-summary",
    icon: FileText,
    title: "Executive Summary",
    description: "High-level readiness overview across all client organizations.",
    available: true,
  },
  {
    href: "/reports/cyber-insurability",
    icon: ShieldCheck,
    title: "Cyber Insurability Readiness Report",
    description: "Readiness against the Cyber Insurability 2025 framework, per organization.",
    available: true,
  },
  {
    href: "/reports/framework-compliance",
    icon: Layers,
    title: "Framework Compliance Report",
    description: "Readiness broken down by framework and requirement.",
    available: true,
  },
  {
    href: "/reports/control-detail",
    icon: ClipboardList,
    title: "Control Detail Report",
    description: "Full control-by-control status detail for a given assessment.",
    available: false,
  },
  {
    href: "/reports/remediation",
    icon: Wrench,
    title: "Remediation Report",
    description: "Open and overdue remediation items with owners and due dates.",
    available: false,
  },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Reporting foundation for Phase 1. Formatted export (PDF) is planned for a later phase.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.available ? report.href : "#"}>
              <Card className={report.available ? "transition-shadow hover:shadow-md" : "opacity-60"}>
                <CardHeader>
                  <Icon className="mb-2 size-6 text-slate-400" />
                  <CardTitle className="text-base font-semibold text-slate-900">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-xs font-medium text-slate-400">
                    {report.available ? "View report" : "Planned for Phase 2"}
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
