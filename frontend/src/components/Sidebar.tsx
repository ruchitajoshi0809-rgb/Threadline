"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { clsx } from "clsx";
import {
  IconOverview,
  IconActivity,
  IconShield,
  IconChart,
  IconUsers,
  IconSettings,
  IconLogo,
  IconClose,
} from "@/components/icons";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: IconOverview },
  { href: "/dashboard/activity", label: "Login Activity", icon: IconActivity },
  { href: "/dashboard/threats", label: "Threat Detection", icon: IconShield },
  { href: "/dashboard/risk", label: "Risk Analysis", icon: IconChart },
  { href: "/dashboard/users", label: "User Management", icon: IconUsers },
  { href: "/dashboard/settings", label: "Settings", icon: IconSettings },
];

export function Sidebar({
  mobileOpen,
  onNavigate,
}: {
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onNavigate}
        className={clsx(
          "fixed inset-0 z-30 bg-black/60 md:hidden",
          !mobileOpen && "hidden",
        )}
      />
      <aside
        className={clsx(
          "h-full w-64 shrink-0 flex-col border-r border-white/10 bg-[#070b16]/95 px-4 py-5 backdrop-blur md:flex",
          mobileOpen ? "fixed inset-y-0 left-0 z-40 flex" : "hidden",
        )}
      >
      <div className="flex items-center justify-between gap-2.5 px-2">
        <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-400 text-slate-950">
          <IconLogo width={20} height={20} />
        </div>
        <div>
          <p className="text-base font-semibold leading-none text-slate-100">
            Threadline
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Behavioural SOC
          </p>
        </div>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close navigation"
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100 md:hidden"
        >
          <IconClose width={18} height={18} />
        </button>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          if (item.href === "/dashboard/users" && user?.role !== "admin")
            return null;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx("nav-link", active && "nav-link-active")}
              onClick={onNavigate}
            >
              <Icon width={18} height={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
        <p className="font-medium text-slate-300">Model status</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse-glow rounded-full bg-emerald-400" />
          <span>Isolation Forest active</span>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-slate-500">
          Anomaly scores are outlier metrics, not attack probabilities.
        </p>
      </div>
      </aside>
    </>
  );
}
