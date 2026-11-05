"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const AXIS = { stroke: "rgba(148,163,184,0.4)", fontSize: 11 };
const GRID = "rgba(148,163,184,0.10)";
const tooltipStyle = {
  background: "rgba(10,15,30,0.95)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: 12,
  color: "#e2e8f0",
  fontSize: 12,
};

function shortDate(d: string) {
  const parts = d.split("-");
  return `${parts[1]}/${parts[2]}`;
}

export function ActivityChart({
  data,
}: {
  data: { date: string; success: number; failed: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gSuccess" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            {...AXIS}
            tickLine={false}
          />
          <YAxis {...AXIS} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(l) => `Date: ${l}`}
          />
          <Area
            type="monotone"
            dataKey="success"
            name="Successful"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#gSuccess)"
          />
          <Area
            type="monotone"
            dataKey="failed"
            name="Failed"
            stroke="#f43f5e"
            strokeWidth={2}
            fill="url(#gFailed)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const RISK_COLORS: Record<string, string> = {
  low: "#34d399",
  medium: "#fbbf24",
  high: "#f43f5e",
};

export function RiskDonut({
  data,
}: {
  data: { level: string; count: number }[];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="level"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.level} fill={RISK_COLORS[d.level] ?? "#64748b"} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            iconType="circle"
            formatter={(v) => (
              <span style={{ color: "#cbd5e1", fontSize: 12, textTransform: "capitalize" }}>
                {v} ({data.find((d) => d.level === v)?.count ?? 0})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="-mt-10 text-center text-xs text-slate-400">
        {total} total logins analysed
      </div>
    </div>
  );
}

export function SignalBars({
  data,
}: {
  data: { signal: string; count: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" {...AXIS} tickLine={false} />
          <YAxis
            type="category"
            dataKey="signal"
            {...AXIS}
            tickLine={false}
            width={130}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="count" name="Detections" fill="#22d3ee" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UserRiskBars({
  data,
}: {
  data: { username: string; highRisk: number; avgRisk: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="username" {...AXIS} tickLine={false} />
          <YAxis {...AXIS} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend formatter={(v) => <span style={{ color: "#cbd5e1", fontSize: 12 }}>{v}</span>} />
          <Bar dataKey="highRisk" name="High-risk events" fill="#f43f5e" radius={[6, 6, 0, 0]} />
          <Bar dataKey="avgRisk" name="Avg risk" fill="#38bdf8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
