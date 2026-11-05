"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { DashboardProvider, useDashboard } from "@/components/DashboardProvider";
import { Sidebar } from "@/components/Sidebar";
import { Loading } from "@/components/ui";
import { IconRefresh, IconMenu } from "@/components/icons";

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const initials = user.username.slice(0, 2).toUpperCase();
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 text-sm hover:bg-white/10"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-sky-400 to-cyan-400 text-xs font-semibold text-slate-950">
          {initials}
        </span>
        <span className="text-slate-200">{user.username}</span>
        <span className="chip bg-white/10 text-slate-300 capitalize">
          {user.role}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#0b1120] p-1 shadow-xl">
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Topbar({
  onMenu,
  menuOpen,
}: {
  onMenu: () => void;
  menuOpen: boolean;
}) {
  const { triggerRefresh } = useDashboard();
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#070b16]/70 px-3 py-3 backdrop-blur sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/5 md:hidden"
        >
          <IconMenu />
        </button>
        <div className="min-w-0">
        <h1 className="text-sm font-semibold text-slate-200">
          Behavioural Security Console
        </h1>
        <p className="text-xs text-slate-500">
          Every login tells a story. Detect the unusual before it becomes a
          threat.
        </p>
        </div>
        {user?.username.startsWith("demo-") && (
          <span className="chip shrink-0 border border-amber-400/30 bg-amber-400/10 text-amber-200">
            DEMO DATA
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={triggerRefresh}
          aria-label="Refresh dashboard data"
          title="Refresh dashboard data"
        >
          <IconRefresh width={16} height={16} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <UserMenu />
      </div>
    </header>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loading label="Authenticating session…" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} menuOpen={mobileOpen} />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
