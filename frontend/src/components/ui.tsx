import type { ReactNode } from "react";
import { clsx } from "clsx";

export function classNames(...args: Parameters<typeof clsx>) {
  return clsx(...args);
}

export function formatDateTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}

const RISK_STYLES: Record<string, string> = {
  low: "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20",
  medium: "bg-amber-400/10 text-amber-300 border border-amber-400/20",
  high: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
};

export function RiskBadge({ level }: { level: string }) {
  const style = RISK_STYLES[level] ?? RISK_STYLES.low;
  return (
    <span className={clsx("chip capitalize", style)}>
      {level === "high" && (
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
      )}
      {level}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-sky-500/10 text-sky-300 border border-sky-500/20",
  reviewed: "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20",
  dismissed: "bg-slate-500/10 text-slate-300 border border-slate-500/20",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.open;
  return <span className={clsx("chip capitalize", style)}>{status}</span>;
}

export function StatCard({
  label,
  value,
  sub,
  accent = "sky",
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "sky" | "rose" | "amber" | "emerald" | "violet";
  icon?: ReactNode;
}) {
  const accents: Record<string, string> = {
    sky: "text-sky-300",
    rose: "text-rose-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
    violet: "text-violet-300",
  };
  return (
    <div className="panel panel-pad animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="card-title">{label}</p>
          <p className={clsx("mt-2 text-3xl font-semibold tracking-tight", accents[accent])}>
            {value}
          </p>
        </div>
        {icon && (
          <div className={clsx("rounded-xl bg-white/5 p-2", accents[accent])}>
            {icon}
          </div>
        )}
      </div>
      {sub && <p className="mt-2 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
      {message}
    </div>
  );
}
