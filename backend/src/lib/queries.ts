import { getCollections } from "@/db";
import type { LoginEvent, SecurityAlert } from "@/db/schema";
import { ObjectId, type Filter } from "mongodb";
import { SAMPLE_ACCOUNT_EMAILS } from "./sampleAccounts.js";
import { FEATURE_NAMES, type EventLike } from "./ml/riskEngine.js";

const REAL_EVENT_FILTER: Filter<LoginEvent> =
  process.env.DEMO_MODE === "true"
    ? { $or: [{ isSimulated: { $ne: true } }, { isDemo: true }] }
    : { isSimulated: { $ne: true } };

export function rowToLike(row: LoginEvent): EventLike {
  return {
    id: row._id.toHexString(),
    userId: row.userId.toHexString(),
    timestamp: new Date(row.timestamp),
    ipAddress: row.ipAddress,
    device: row.device,
    browser: row.browser,
    location: row.location,
    loginStatus: row.loginStatus,
  };
}

export interface EventRow {
  id: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  device: string;
  browser: string;
  location: string;
  loginStatus: string;
  riskScore: number;
  riskLevel: string;
  detectionReasons: string | null;
  mlAnomalyScore: number | null;
  username: string | null;
  userRole: string | null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function toEventRows(events: LoginEvent[]): Promise<EventRow[]> {
  const { users } = await getCollections();
  const userIds = [...new Set(events.map((event) => event.userId.toHexString()))]
    .map((id) => new ObjectId(id));
  const userRows = userIds.length
    ? await users
        .find({ _id: { $in: userIds } }, { projection: { username: 1, role: 1 } })
        .toArray()
    : [];
  const userMap = new Map(
    userRows.map((user) => [user._id.toHexString(), user]),
  );
  return events.map((event) => {
    const user = userMap.get(event.userId.toHexString());
    return {
      id: event._id.toHexString(),
      userId: event.userId.toHexString(),
      timestamp: event.timestamp,
      ipAddress: event.ipAddress,
      device: event.device,
      browser: event.browser,
      location: event.location,
      loginStatus: event.loginStatus,
      riskScore: event.riskScore,
      riskLevel: event.riskLevel,
      detectionReasons: event.detectionReasons,
      mlAnomalyScore: event.mlAnomalyScore,
      username: user?.username ?? null,
      userRole: user?.role ?? null,
    };
  });
}

export async function getEvents(filter: {
  riskLevel?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: EventRow[]; total: number }> {
  const { loginEvents, users } = await getCollections();
  const clauses: Filter<LoginEvent>[] = [REAL_EVENT_FILTER];
  if (filter.riskLevel && filter.riskLevel !== "all") {
    clauses.push({ riskLevel: filter.riskLevel as LoginEvent["riskLevel"] });
  }
  const search = filter.search?.trim();
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    const matchingUsers = await users
      .find({ username: regex }, { projection: { _id: 1 } })
      .toArray();
    clauses.push({
      $or: [
        { ipAddress: regex },
        { location: regex },
        { device: regex },
        { userId: { $in: matchingUsers.map((user) => user._id) } },
      ],
    });
  }
  const query: Filter<LoginEvent> = { $and: clauses };

  const [events, total] = await Promise.all([
    loginEvents
      .find(query)
      .sort({ timestamp: -1 })
      .skip(Math.max(0, filter.offset ?? 0))
      .limit(Math.min(500, Math.max(1, filter.limit ?? 25)))
      .toArray(),
    loginEvents.countDocuments(query),
  ]);
  return { rows: await toEventRows(events), total };
}

export interface AlertRow {
  id: string;
  alertType: string;
  description: string;
  severity: string;
  status: string;
  createdAt: Date;
  eventId: string;
  username: string | null;
  ipAddress: string | null;
  riskScore: number | null;
  riskLevel: string | null;
}

export async function getAlerts(filter: {
  status?: string;
  severity?: string;
  limit?: number;
}): Promise<{ rows: AlertRow[]; total: number }> {
  const { securityAlerts, loginEvents, users } = await getCollections();
  const realEvents = await loginEvents
    .find(REAL_EVENT_FILTER, { projection: { _id: 1 } })
    .toArray();
  const query: Filter<SecurityAlert> = {
    eventId: { $in: realEvents.map((event) => event._id) },
  };
  if (filter.status && filter.status !== "all") {
    query.status = filter.status as SecurityAlert["status"];
  }
  if (filter.severity && filter.severity !== "all") {
    query.severity = filter.severity as SecurityAlert["severity"];
  }

  const [alerts, total] = await Promise.all([
    securityAlerts
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(500, Math.max(1, filter.limit ?? 25)))
      .toArray(),
    securityAlerts.countDocuments(query),
  ]);
  const eventIds = alerts.map((alert) => alert.eventId);
  const events = eventIds.length
    ? await loginEvents.find({ _id: { $in: eventIds } }).toArray()
    : [];
  const eventMap = new Map(
    events.map((event) => [event._id.toHexString(), event]),
  );
  const userIds = [...new Set(events.map((event) => event.userId.toHexString()))]
    .map((id) => new ObjectId(id));
  const userRows = userIds.length
    ? await users
        .find({ _id: { $in: userIds } }, { projection: { username: 1 } })
        .toArray()
    : [];
  const userMap = new Map(
    userRows.map((user) => [user._id.toHexString(), user.username]),
  );

  return {
    total,
    rows: alerts.map((alert) => {
      const event = eventMap.get(alert.eventId.toHexString());
      return {
        id: alert._id.toHexString(),
        alertType: alert.alertType,
        description: alert.description,
        severity: alert.severity,
        status: alert.status,
        createdAt: alert.createdAt,
        eventId: alert.eventId.toHexString(),
        username: event ? userMap.get(event.userId.toHexString()) ?? null : null,
        ipAddress: event?.ipAddress ?? null,
        riskScore: event?.riskScore ?? null,
        riskLevel: event?.riskLevel ?? null,
      };
    }),
  };
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface DashboardStats {
  overview: {
    total: number;
    successful: number;
    failed: number;
    suspicious: number;
    highRisk: number;
    openAlerts: number;
  };
  activity: { date: string; success: number; failed: number }[];
  riskDistribution: { level: string; count: number }[];
  recentAlerts: AlertRow[];
  insights: {
    id: string;
    text: string;
    severity: string;
    username: string | null;
    ipAddress: string | null;
    riskScore: number | null;
  }[];
  model: {
    algorithm: string;
    features: readonly string[];
    note: string;
  };
}

export async function getStats(): Promise<DashboardStats> {
  const { loginEvents, securityAlerts, users } = await getCollections();
  const events = await loginEvents
    .find(REAL_EVENT_FILTER)
    .sort({ timestamp: -1 })
    .toArray();
  const eventIds = events.map((event) => event._id);
  const [openAlerts, distribution, recentAlerts, highAlerts] =
    await Promise.all([
      securityAlerts.countDocuments({
        status: "open",
        eventId: { $in: eventIds },
      }),
      loginEvents
        .aggregate<{ _id: string; count: number }>([
          { $match: REAL_EVENT_FILTER },
          { $group: { _id: "$riskLevel", count: { $sum: 1 } } },
        ])
        .toArray(),
      getAlerts({ limit: 8 }),
      securityAlerts
        .find({
          severity: "high",
          eventId: { $in: eventIds },
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray(),
    ]);

  const activityBuckets = new Map<string, { success: number; failed: number }>();
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - i);
    activityBuckets.set(dayKey(date), { success: 0, failed: 0 });
  }
  for (const event of events) {
    const bucket = activityBuckets.get(dayKey(event.timestamp));
    if (bucket) bucket[event.loginStatus]++;
  }

  const highEventIds = highAlerts.map((alert) => alert.eventId);
  const highEvents = highEventIds.length
    ? await loginEvents.find({ _id: { $in: highEventIds } }).toArray()
    : [];
  const highEventsMap = new Map(
    highEvents.map((event) => [event._id.toHexString(), event]),
  );
  const highUserIds = [...new Set(highEvents.map((event) => event.userId.toHexString()))]
    .map((id) => new ObjectId(id));
  const highUsers = highUserIds.length
    ? await users
        .find({ _id: { $in: highUserIds } }, { projection: { username: 1 } })
        .toArray()
    : [];
  const highUserMap = new Map(
    highUsers.map((user) => [user._id.toHexString(), user.username]),
  );

  return {
    overview: {
      total: events.length,
      successful: events.filter((event) => event.loginStatus === "success").length,
      failed: events.filter((event) => event.loginStatus === "failed").length,
      suspicious: events.filter((event) => event.riskLevel !== "low").length,
      highRisk: events.filter((event) => event.riskLevel === "high").length,
      openAlerts,
    },
    activity: [...activityBuckets.entries()].map(([date, counts]) => ({
      date,
      ...counts,
    })),
    riskDistribution: (["low", "medium", "high"] as const).map((level) => ({
      level,
      count: distribution.find((item) => item._id === level)?.count ?? 0,
    })),
    recentAlerts: recentAlerts.rows,
    insights: highAlerts.map((alert) => {
      const event = highEventsMap.get(alert.eventId.toHexString());
      return {
        id: alert._id.toHexString(),
        text: alert.description,
        severity: alert.severity,
        username: event
          ? highUserMap.get(event.userId.toHexString()) ?? null
          : null,
        ipAddress: event?.ipAddress ?? null,
        riskScore: event?.riskScore ?? null,
      };
    }),
    model: {
      algorithm: "Isolation Forest (unsupervised)",
      features: FEATURE_NAMES,
      note: "Anomaly score is an outlier metric, not a probability of attack.",
    },
  };
}

export interface UserStat {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: Date;
  totalLogins: number;
  failedLogins: number;
  suspiciousLogins: number;
  highRiskLogins: number;
  lastLogin: Date | null;
  avgRisk: number;
}

export async function getUsersWithStats(): Promise<UserStat[]> {
  const { users, loginEvents } = await getCollections();
  const [userRows, events] = await Promise.all([
    users
      .find({ email: { $nin: SAMPLE_ACCOUNT_EMAILS } })
      .sort({ createdAt: -1 })
      .toArray(),
    loginEvents.find(REAL_EVENT_FILTER).toArray(),
  ]);
  const eventsByUser = new Map<string, LoginEvent[]>();
  for (const event of events) {
    const key = event.userId.toHexString();
    const list = eventsByUser.get(key) ?? [];
    list.push(event);
    eventsByUser.set(key, list);
  }

  return userRows.map((user) => {
    const userEvents = eventsByUser.get(user._id.toHexString()) ?? [];
    const lastLogin = userEvents.reduce<Date | null>(
      (latest, event) =>
        !latest || event.timestamp > latest ? event.timestamp : latest,
      null,
    );
    return {
      id: user._id.toHexString(),
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      totalLogins: userEvents.length,
      failedLogins: userEvents.filter((event) => event.loginStatus === "failed").length,
      suspiciousLogins: userEvents.filter((event) => event.riskLevel !== "low").length,
      highRiskLogins: userEvents.filter((event) => event.riskLevel === "high").length,
      lastLogin,
      avgRisk: userEvents.length
        ? Math.round(
            userEvents.reduce((sum, event) => sum + event.riskScore, 0) /
              userEvents.length,
          )
        : 0,
    };
  });
}

export interface RiskAnalysis {
  distribution: { level: string; count: number }[];
  perUser: {
    username: string;
    total: number;
    highRisk: number;
    avgRisk: number;
    mlAvg: number;
  }[];
  topSignals: { signal: string; count: number }[];
  anomalies: EventRow[];
}

export async function getRiskAnalysis(): Promise<RiskAnalysis> {
  const { loginEvents } = await getCollections();
  const events = await loginEvents.find(REAL_EVENT_FILTER).toArray();
  const rows = await toEventRows(events);
  const usernameByEventId = new Map(rows.map((row) => [row.id, row.username]));
  const grouped = new Map<string, LoginEvent[]>();
  for (const event of events) {
    const key = usernameByEventId.get(event._id.toHexString()) ?? "unknown";
    const group = grouped.get(key) ?? [];
    group.push(event);
    grouped.set(key, group);
  }

  const signalCounts = new Map<string, number>();
  for (const row of rows) {
    if (!row.detectionReasons) continue;
    try {
      const reasons = JSON.parse(row.detectionReasons) as {
        source?: string;
        signal?: string;
      }[];
      for (const reason of reasons) {
        if (reason.source === "rule" && reason.signal) {
          signalCounts.set(reason.signal, (signalCounts.get(reason.signal) ?? 0) + 1);
        }
      }
    } catch {
      // Ignore malformed historical reason payloads.
    }
  }

  return {
    distribution: (["low", "medium", "high"] as const).map((level) => ({
      level,
      count: events.filter((event) => event.riskLevel === level).length,
    })),
    perUser: [...grouped.entries()].map(([username, userEvents]) => ({
      username,
      total: userEvents.length,
      highRisk: userEvents.filter((event) => event.riskLevel === "high").length,
      avgRisk: userEvents.length
        ? Math.round(
            userEvents.reduce((sum, event) => sum + event.riskScore, 0) /
              userEvents.length,
          )
        : 0,
      mlAvg: userEvents.length
        ? Number(
            (
              userEvents.reduce((sum, event) => sum + (event.mlAnomalyScore ?? 0), 0) /
              userEvents.length
            ).toFixed(2),
          )
        : 0,
    })),
    topSignals: [...signalCounts.entries()]
      .map(([signal, count]) => ({ signal, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    anomalies: rows
      .filter((row) => row.riskLevel !== "low")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 12),
  };
}
