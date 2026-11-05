"use client";

import { useApi } from "@/components/useApi";
import {
  RiskBadge,
  Loading,
  ErrorBox,
  SectionTitle,
  formatDateTime,
} from "@/components/ui";
import { RiskDonut, SignalBars, UserRiskBars } from "@/components/Charts";
import type { RiskAnalysis } from "@/components/types";

const SIGNAL_LABELS: Record<string, string> = {
  brute_force: "Brute-force pattern",
  repeated_failures: "Repeated failures",
  new_ip: "New IP address",
  device_change: "Device change",
  browser_change: "Browser change",
  geo_change: "Geographic change",
  unusual_hours: "Unusual hours",
  abnormal_frequency: "Abnormal frequency",
  failed_login: "Failed login",
};

export default function RiskPage() {
  const { data, loading, error } = useApi<RiskAnalysis>("/api/risk-analysis");

  if (loading) return <Loading label="Analysing risk signals…" />;
  if (error || !data)
    return <ErrorBox message={error ?? "No data available."} />;

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Risk Analysis"
        subtitle="How the Isolation Forest and rule engine distribute risk across users and signals"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel panel-pad">
          <SectionTitle title="Risk Distribution" />
          <RiskDonut data={data.distribution} />
        </div>
        <div className="panel panel-pad lg:col-span-2">
          <SectionTitle
            title="Per-User Risk"
            subtitle="High-risk events and average risk score per monitored account"
          />
          <UserRiskBars
            data={data.perUser.map((u) => ({
              username: u.username,
              highRisk: u.highRisk,
              avgRisk: u.avgRisk,
            }))}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel panel-pad">
          <SectionTitle
            title="Top Behavioural Signals"
            subtitle="Most frequent rule-based detection reasons"
          />
          <SignalBars
            data={data.topSignals.map((s) => ({
              signal: SIGNAL_LABELS[s.signal] ?? s.signal,
              count: s.count,
            }))}
          />
        </div>
        <div className="panel panel-pad">
          <SectionTitle
            title="Model Notes"
            subtitle="Interpreting the anomaly engine"
          />
          <p className="text-sm leading-relaxed text-slate-400">
            Threadline trains an <strong className="text-slate-200">Isolation Forest</strong> on the
            historical distribution of normal logins. Each new login is scored as
            an outlier: a higher score means the event was easier to isolate
            from the baseline. This score is <em>not</em> a calibrated
            probability of an attack.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              "login hour (cyclic)",
              "day of week",
              "failed attempts",
              "IP change",
              "device change",
              "browser change",
              "location change",
              "time since last login",
              "login frequency",
            ].map((f) => (
              <span
                key={f}
                className="chip bg-white/5 text-slate-300"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="panel panel-pad">
        <SectionTitle
          title="Flagged Anomalies"
          subtitle="All events that scored above the low-risk band"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">IP / Location</th>
                <th className="px-4 py-2 text-left">ML Score</th>
                <th className="px-4 py-2 text-left">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.anomalies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No anomalies detected.
                  </td>
                </tr>
              )}
              {data.anomalies.map((a) => (
                <tr key={a.id} className="hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-2 text-slate-300">
                    {formatDateTime(a.timestamp)}
                  </td>
                  <td className="px-4 py-2 text-slate-200">{a.username ?? "—"}</td>
                  <td className="px-4 py-2">
                    <div className="text-slate-300">{a.ipAddress}</div>
                    <div className="text-xs text-slate-500">{a.location}</div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-violet-300">
                    {a.mlAnomalyScore != null ? a.mlAnomalyScore.toFixed(3) : "n/a"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">
                        {a.riskScore}
                      </span>
                      <RiskBadge level={a.riskLevel} />
                    </div>
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
