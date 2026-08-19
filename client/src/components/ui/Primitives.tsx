import clsx from "clsx";
import { Loader2, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx("rounded-2xl border border-gray-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Available: "bg-emerald-100 text-emerald-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Upcoming: "bg-amber-100 text-amber-700",
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Occupied: "bg-blue-100 text-blue-700",
  Partial: "bg-orange-100 text-orange-700",
  CheckedOut: "bg-gray-200 text-gray-700",
  Cancelled: "bg-red-100 text-red-700",
  Failed: "bg-red-100 text-red-700",
  Refunded: "bg-purple-100 text-purple-700",
  Maintenance: "bg-red-100 text-red-700",
};

export function Badge({ children }: { children: ReactNode }) {
  const key = String(children);
  const cls = badgeColors[key] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", cls)}>
      {children}
    </span>
  );
}

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ title = "Wax lama helin", subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
      <Inbox className="h-8 w-8" />
      <span className="text-sm font-medium text-gray-500">{title}</span>
      {subtitle && <span className="text-xs">{subtitle}</span>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
