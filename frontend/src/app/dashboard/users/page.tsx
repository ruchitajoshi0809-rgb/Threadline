"use client";

import { useState } from "react";
import { useApi } from "@/components/useApi";
import { useAuth } from "@/components/AuthContext";
import { useDashboard } from "@/components/DashboardProvider";
import {
  Loading,
  ErrorBox,
  SectionTitle,
  formatDateTime,
} from "@/components/ui";
import { IconUsers } from "@/components/icons";
import type { UserStat } from "@/components/types";

export default function UsersPage() {
  const { user } = useAuth();
  const { triggerRefresh } = useDashboard();
  const { data, loading, error } = useApi<{ users: UserStat[] }>(
    "/api/users",
  );
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [msg, setMsg] = useState<string | null>(null);

  if (user?.role !== "admin") {
    return (
      <div className="panel panel-pad">
        <SectionTitle title="User Management" />
        <p className="text-sm text-slate-400">
          Administrator access is required to view and manage users.
        </p>
      </div>
    );
  }

  if (loading) return <Loading label="Loading users…" />;
  if (error || !data)
    return <ErrorBox message={error ?? "Failed to load users."} />;

  async function createUser() {
    setMsg(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, createSession: false }),
    });
    const d = await res.json();
    if (!res.ok) {
      setMsg(d.error ?? "Failed to create user.");
      return;
    }
    setMsg(`User "${form.username}" created.`);
    setForm({ username: "", email: "", password: "" });
    triggerRefresh();
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="User Management"
        subtitle="Monitored accounts and their behavioural risk profile"
      />

      <div className="panel panel-pad grid gap-4 md:grid-cols-4">
        <input
          className="input"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          className="input"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input"
          placeholder="Temp password (min 8)"
          type="text"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn btn-primary" onClick={createUser}>
          <IconUsers width={16} height={16} />
          Create User
        </button>
      </div>
      {msg && <p className="text-xs text-emerald-300">{msg}</p>}

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-right">Logins</th>
                <th className="px-4 py-3 text-right">Failed</th>
                <th className="px-4 py-3 text-right">Suspicious</th>
                <th className="px-4 py-3 text-right">High-Risk</th>
                <th className="px-4 py-3 text-right">Avg Risk</th>
                <th className="px-4 py-3 text-left">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="text-slate-100">{u.username}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="chip bg-white/5 text-slate-300 capitalize">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {u.totalLogins}
                  </td>
                  <td className="px-4 py-3 text-right text-rose-300">
                    {u.failedLogins}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-300">
                    {u.suspiciousLogins}
                  </td>
                  <td className="px-4 py-3 text-right text-rose-300">
                    {u.highRiskLogins}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-100">
                    {u.avgRisk}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {u.lastLogin ? formatDateTime(u.lastLogin) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
