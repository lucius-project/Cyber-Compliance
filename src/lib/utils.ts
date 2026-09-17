import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

const NON_OVERDUE_STATUSES = new Set(["COMPLETED", "ACCEPTED_RISK"]);

export function isOverdue(dueDate: Date | null, status: string): boolean {
  if (!dueDate || NON_OVERDUE_STATUSES.has(status)) return false;
  return dueDate.getTime() < Date.now();
}
