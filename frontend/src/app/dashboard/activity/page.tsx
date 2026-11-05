"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/components/useApi";
import {
  RiskBadge,
  Loading,
  ErrorBox,
  SectionTitle,
  formatDateTime,
} from "@/components/ui";
import { IconSearch } from "@/components/icons";
import type { EventRow } from "@/components/types";

interface Reason {
  source: "rule" | "ml";
  signal: string;
  detail: string;
}

export default function ActivityPage() {
  const [riskLevel, setRiskLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const url = `/api/logins?riskLevel=${riskLevel}&search=${encodeURIComponent(
    search,
  )}&limit=60`;
  const { data, loading, error } = useApi<{ rows: EventRow[]; total: number }>(
    url,
  );

  const rows = data?.rows ?? [];

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Login Activity"
        subtitle="Every analysed authentication event with its behavioural risk score"
      />

      <div className="panel panel-pad flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <IconSearch
            width={16}
            height={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            className="input pl-9"
            placeholder="Search by user, IP address, location or device…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
          {["all", "low", "medium", "high"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setRiskLevel(lvl)}
              className={`rounded-md px-3 py-1.5 text-sm capitalize transition ${
                riskLevel === lvl
                  ? "bg-sky-500/15 text-sky-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {loading && <Loading label="Loading login events…" />}
      {error && <ErrorBox message={error} />}

      {!loading && !error && (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">IP / Location</th>
                  <th className="px-4 py-3 text-left">Device / Browser</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No events match your filters.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <RowItem
                    key={r.id}
                    row={r}
                    expanded={expanded === r.id}
                    onToggle={() =>
                      setExpanded(expanded === r.id ? null : r.id)
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-slate-400">
            <span>{data?.total ?? 0} total events</span>
            <span>Showing latest {rows.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RowItem({
  row,
  expanded,
  onToggle,
}: {
  row: EventRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  let reasons: Reason[] = [];
  try {
    reasons = row.detectionReasons ? JSON.parse(row.detectionReasons) : [];
  } catch {
    reasons = [];
  }

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-white/[0.02] align-top"
      >
        <td className="whitespace-nowrap px-4 py-3 text-slate-300">
          {formatDateTime(row.timestamp)}
        </td>
        <td className="px-4 py-3">
          <div className="text-slate-200">{row.username ?? "—"}</div>
        </td>
        <td className="px-4 py-3">
          <div className="text-slate-300">{row.ipAddress}</div>
          <div className="text-xs text-slate-500">{row.location}</div>
        </td>
        <td className="px-4 py-3">
          <div className="text-slate-300">{row.device}</div>
          <div className="text-xs text-slate-500">{row.browser}</div>
        </td>
        <td className="px-4 py-3">
          <span
            className={`chip ${
              row.loginStatus === "success"
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-rose-500/10 text-rose-300"
            }`}
          >
            {row.loginStatus}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-slate-100">
              {row.riskScore}
            </span>
            <RiskBadge level={row.riskLevel} />
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-white/[0.02]">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="card-title mb-2">Detection Breakdown</p>
                {reasons.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No behavioural deviations detected — within normal baseline.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {reasons.map((rs, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`chip ${
                              rs.source === "ml"
                                ? "bg-violet-500/10 text-violet-300"
                                : "bg-sky-500/10 text-sky-300"
                            }`}
                          >
                            {rs.source === "ml" ? "ML" : "RULE"}
                          </span>
                          <span className="text-sm font-medium text-slate-200">
                            {rs.signal.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {rs.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="card-title mb-2">Signal Metadata</p>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <Meta label="ML anomaly" value={row.mlAnomalyScore?.toFixed(3) ?? "n/a"} />
                  <Meta label="Risk level" value={row.riskLevel} />
                  <Meta label="Status" value={row.loginStatus} />
                </dl>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-200">{value}</dd>
    </div>
  );
}
