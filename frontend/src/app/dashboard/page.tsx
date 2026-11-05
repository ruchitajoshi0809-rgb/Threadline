"use client";

import { useAuth } from "@/components/AuthContext";
import { useApi } from "@/components/useApi";
import {
  StatCard,
  RiskBadge,
  StatusBadge,
  Loading,
  ErrorBox,
  SectionTitle,
  relativeTime,
} from "@/components/ui";
import { ActivityChart, RiskDonut } from "@/components/Charts";
import type { DashboardStats } from "@/components/types";
import {
  IconActivity,
  IconShield,
  IconAlert,
  IconBolt,
} from "@/components/icons";

export default function OverviewPage() {
  const { user } = useAuth();
  const { data, loading, error } = useApi<DashboardStats>(
    "/api/dashboard/stats",
  );

  if (loading) return <Loading label="Loading security overview…" />;
  if (error || !data)
    return <ErrorBox message={error ?? "No data available."} />;

  const o = data.overview;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="overview-hero panel relative overflow-hidden p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="overview-eyebrow">
              <span className="overview-pulse" />
              BEHAVIOURAL MONITORING
            </p>
            <h1 className="overview-title mt-4">
              {user?.username ? (
                <>A clearer view, <span>{user.username}.</span></>
              ) : (
                <>A clearer view of <span>every signal.</span></>
              )}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Identity patterns, unusual behaviour, and the details that need
              your attention — brought together in one place.
            </p>
          </div>
          <div className="flex min-w-[210px] items-center gap-3 rounded-xl border border-lime-200/10 bg-black/20 px-4 py-3.5 backdrop-blur">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300/10 text-lime-200">
              <IconBolt />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Detection engine
              </p>
              <p className="mt-1 text-sm font-medium text-slate-200">
                {data.model.algorithm}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Logins" value={o.total} accent="sky" icon={<IconActivity />} />
        <StatCard
          label="Successful"
          value={o.successful}
          accent="emerald"
          sub={`${o.total ? Math.round((o.successful / o.total) * 100) : 0}% success rate`}
        />
        <StatCard
          label="Failed"
          value={o.failed}
          accent="rose"
          sub="blocked / mistyped"
        />
        <StatCard
          label="Suspicious"
          value={o.suspicious}
          accent="amber"
          sub="risk ≥ medium"
        />
        <StatCard
          label="High-Risk"
          value={o.highRisk}
          accent="rose"
          sub="immediate review"
          icon={<IconAlert />}
        />
        <StatCard
          label="Open Alerts"
          value={o.openAlerts}
          accent="violet"
          sub="unresolved"
          icon={<IconShield />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel panel-pad lg:col-span-2">
          <SectionTitle
            title="Login Activity"
            subtitle="Successful vs. failed logins over the last 14 days"
          />
          <ActivityChart data={data.activity} />
        </div>
        <div className="panel panel-pad">
          <SectionTitle
            title="Risk Distribution"
            subtitle="Scored login events by risk band"
          />
          <RiskDonut data={data.riskDistribution} />
        </div>
      </div>

      {/* Insights + alerts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel panel-pad">
          <SectionTitle
            title="AI Security Insights"
            subtitle="Explainable analyses from the anomaly engine"
          />
          {data.insights.length === 0 ? (
            <p className="text-sm text-slate-400">
              No high-risk events have been recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.insights.map((ins) => (
                <div
                  key={ins.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <RiskBadge level={ins.severity} />
                    {ins.username && (
                      <span className="text-xs text-slate-400">
                        {ins.username}
                        {ins.ipAddress ? ` · ${ins.ipAddress}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-snug text-slate-300">
                    {ins.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel panel-pad">
          <SectionTitle
            title="Recent Security Alerts"
            subtitle="Latest flagged events requiring review"
          />
          {data.recentAlerts.length === 0 ? (
            <p className="text-sm text-slate-400">No alerts yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">When</th>
                    <th className="px-3 py-2 text-left">User</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Sev.</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recentAlerts.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-2 text-slate-400">
                        {relativeTime(a.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {a.username ?? "—"}
                      </td>
                      <td className="px-3 py-2 capitalize text-slate-300">
                        {a.alertType.replace(/_/g, " ")}
                      </td>
                      <td className="px-3 py-2">
                        <RiskBadge level={a.severity} />
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
