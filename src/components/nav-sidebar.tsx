"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  ShieldCheck,
  Layers,
  Wrench,
  FileText,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organizations", label: "Organizations", icon: Building2 },
  { href: "/assessments", label: "Assessments", icon: ClipboardCheck },
  { href: "/controls", label: "Controls", icon: ShieldCheck },
  { href: "/frameworks", label: "Frameworks", icon: Layers },
  { href: "/remediation", label: "Remediation", icon: Wrench },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <ShieldAlert className="size-6 text-slate-900" />
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-900">Cyber Compliance</p>
          <p className="text-xs text-slate-500">MSP Readiness Platform</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-400">
        Phase 1 foundation build
      </div>
    </aside>
  );
}
