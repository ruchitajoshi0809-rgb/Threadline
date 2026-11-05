/**
 * Threadline risk engine.
 *
 * Every analysed login is scored with two independent signals that are kept
 * clearly distinct in the UI and the stored `detection_reasons`:
 *
 *  1. RULE-BASED HEURISTICS — deterministic, explainable checks against the
 *     user's behavioural baseline (new IP, new device, unusual hour, repeated
 *     failures, geographic change, abnormal frequency).
 *  2. MACHINE-LEARNING ANOMALY DETECTION — an Isolation Forest trained on the
 *     historical "normal" feature distribution. Its output is an anomaly score
 *     in [0, 1]; it is deliberately *not* presented as a probability of attack.
 *
 * The two signals are blended into a single 0–100 risk score.
 */

import { IsolationForest } from "./isolationForest.js";

export type RiskLevel = "low" | "medium" | "high";
export type AlertType =
  | "brute_force"
  | "new_ip"
  | "device_change"
  | "browser_change"
  | "geo_change"
  | "unusual_hours"
  | "abnormal_frequency"
  | "combined_threat"
  | "suspicious_login";

export interface EventLike {
  id?: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  device: string;
  browser: string;
  location: string;
  loginStatus: "success" | "failed";
}

export interface AttemptInput extends EventLike {
  userId: string;
}

export interface DetectionReason {
  source: "rule" | "ml";
  signal: string;
  detail: string;
}

export interface RiskResult {
  riskScore: number;
  riskLevel: RiskLevel;
  mlAnomalyScore: number | null;
  mlRisk: number;
  ruleRisk: number;
  reasons: DetectionReason[];
  alertType: AlertType | null;
  insight: string;
  features: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Feature definition
// ---------------------------------------------------------------------------

export const FEATURE_NAMES = [
  "hour_sin",
  "hour_cos",
  "day_of_week",
  "is_weekend",
  "failed_attempts_24h",
  "ip_changed",
  "device_changed",
  "browser_changed",
  "location_changed",
  "hours_since_last_login",
  "logins_per_day",
] as const;

interface Baseline {
  sufficient: boolean;
  knownIps: Set<string>;
  knownDevices: Set<string>;
  knownBrowsers: Set<string>;
  knownLocations: Set<string>;
  typicalHours: Set<number>;
  lastLoginAt: Date | null;
  successCount: number;
}

const NIGHT_WINDOW = [0, 1, 2, 3, 4, 5];

function startOfWindow(ts: Date, hoursBack: number): number {
  return ts.getTime() - hoursBack * 3600 * 1000;
}

function countInWindow(
  events: EventLike[],
  userId: string,
  before: Date,
  hoursBack: number,
  status?: "success" | "failed",
): number {
  const from = startOfWindow(before, hoursBack);
  let n = 0;
  for (const e of events) {
    if (e.userId !== userId) continue;
    if (status && e.loginStatus !== status) continue;
    const t = e.timestamp.getTime();
    if (t >= from && t < before.getTime()) n++;
  }
  return n;
}

function buildBaseline(
  userId: string,
  upTo: Date,
  events: EventLike[],
): Baseline {
  const history = events
    .filter(
      (e) =>
        e.userId === userId &&
        e.loginStatus === "success" &&
        e.timestamp.getTime() < upTo.getTime(),
    )
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const baseline: Baseline = {
    sufficient: false,
    knownIps: new Set(),
    knownDevices: new Set(),
    knownBrowsers: new Set(),
    knownLocations: new Set(),
    typicalHours: new Set(),
    lastLoginAt: history.length ? history[history.length - 1].timestamp : null,
    successCount: history.length,
  };

  for (const e of history) {
    baseline.knownIps.add(e.ipAddress);
    baseline.knownDevices.add(e.device);
    baseline.knownBrowsers.add(e.browser);
    baseline.knownLocations.add(e.location);
  }

  if (history.length < 6) return baseline; // not enough to fingerprint yet
  baseline.sufficient = true;

  const hourCounts = new Map<number, number>();
  for (const e of history) {
    const h = e.timestamp.getUTCHours();
    hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
  }
  const total = history.length;
  const threshold = Math.max(2, total * 0.15);
  for (const [h, c] of hourCounts) {
    if (c >= threshold) {
      baseline.typicalHours.add(h);
      baseline.typicalHours.add((h + 1) % 24);
      baseline.typicalHours.add((h + 23) % 24);
    }
  }
  return baseline;
}

function buildFeatures(
  attempt: AttemptInput,
  baseline: Baseline,
  events: EventLike[],
): { features: number[]; signals: Record<string, number | boolean> } {
  const ts = attempt.timestamp;
  const hour = ts.getUTCHours();
  const dow = ts.getUTCDay();
  const isWeekend = dow === 0 || dow === 6 ? 1 : 0;
  const hourRad = (hour / 24) * 2 * Math.PI;

  const failedAttempts = countInWindow(
    events,
    attempt.userId,
    ts,
    24,
    "failed",
  );
  const loginsPerDay =
    countInWindow(events, attempt.userId, ts, 24, "success") +
    (attempt.loginStatus === "success" ? 1 : 0);

  const ipChanged =
    baseline.sufficient && !baseline.knownIps.has(attempt.ipAddress);
  const deviceChanged =
    baseline.sufficient && !baseline.knownDevices.has(attempt.device);
  const browserChanged =
    baseline.sufficient && !baseline.knownBrowsers.has(attempt.browser);
  const locationChanged =
    baseline.sufficient && !baseline.knownLocations.has(attempt.location);

  const unusualHour =
    baseline.sufficient &&
    !baseline.typicalHours.has(hour) &&
    NIGHT_WINDOW.includes(hour);

  const hoursSinceLast = baseline.lastLoginAt
    ? Math.min(
        72,
        (ts.getTime() - baseline.lastLoginAt.getTime()) / 3600000,
      )
    : 12;

  const features = [
    Math.sin(hourRad),
    Math.cos(hourRad),
    dow,
    isWeekend,
    Math.min(10, failedAttempts),
    ipChanged ? 1 : 0,
    deviceChanged ? 1 : 0,
    browserChanged ? 1 : 0,
    locationChanged ? 1 : 0,
    hoursSinceLast,
    Math.min(20, loginsPerDay),
  ];

  return {
    features,
    signals: {
      hour,
      failedAttempts,
      loginsPerDay,
      ipChanged,
      deviceChanged,
      browserChanged,
      locationChanged,
      unusualHour,
    },
  };
}

// ---------------------------------------------------------------------------
// Risk blending
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

/** Map a raw IF score to a 0–100 ML risk using the training (normal) spread. */
function anchorMlRisk(score: number, trainScores: number[]): number {
  if (trainScores.length < 5) {
    // Fallback linear mapping when there is no real baseline yet.
    if (score < 0.5) return 0;
    return Math.min(100, Math.round((score - 0.5) * 200));
  }
  const sorted = [...trainScores].sort((a, b) => a - b);
  const median = percentile(sorted, 0.5);
  const p90 = percentile(sorted, 0.9);
  if (score <= median) return 0;
  if (p90 === median) return 100;
  return Math.min(100, Math.round(((score - median) / (p90 - median)) * 100));
}

function classify(score: number): RiskLevel {
  if (score >= 71) return "high";
  if (score >= 31) return "medium";
  return "low";
}

interface RuleOutput {
  ruleRisk: number;
  reasons: DetectionReason[];
  alertType: AlertType | null;
}

function evaluateRules(
  signals: Record<string, number | boolean>,
  attempt: AttemptInput,
): RuleOutput {
  const reasons: DetectionReason[] = [];
  let ruleRisk = 0;
  const failed = Number(signals.failedAttempts);
  const ip = Boolean(signals.ipChanged);
  const dev = Boolean(signals.deviceChanged);
  const brw = Boolean(signals.browserChanged);
  const geo = Boolean(signals.locationChanged);
  const hr = Boolean(signals.unusualHour);
  const freq = Number(signals.loginsPerDay);

  if (failed >= 5) {
    ruleRisk += 70;
    reasons.push({
      source: "rule",
      signal: "brute_force",
      detail: `${failed} failed authentication attempts detected in the last 24 hours.`,
    });
  } else if (failed >= 3) {
    ruleRisk += 40;
    reasons.push({
      source: "rule",
      signal: "repeated_failures",
      detail: `${failed} consecutive failed attempts before this login.`,
    });
  } else if (attempt.loginStatus === "failed") {
    ruleRisk += 8;
    reasons.push({
      source: "rule",
      signal: "failed_login",
      detail: "Authentication failed for this attempt.",
    });
  }

  if (ip) {
    ruleRisk += 35;
    reasons.push({
      source: "rule",
      signal: "new_ip",
      detail: `Login originated from ${attempt.ipAddress}, which has never been seen for this user.`,
    });
  }
  if (dev) {
    ruleRisk += 25;
    reasons.push({
      source: "rule",
      signal: "device_change",
      detail: `Unrecognized device: ${attempt.device}.`,
    });
  }
  if (brw) {
    ruleRisk += 15;
    reasons.push({
      source: "rule",
      signal: "browser_change",
      detail: `Browser changed to ${attempt.browser}.`,
    });
  }
  if (geo) {
    ruleRisk += 35;
    reasons.push({
      source: "rule",
      signal: "geo_change",
      detail: `Login from ${attempt.location}, outside the user's known geographies.`,
    });
  }
  if (hr) {
    ruleRisk += 25;
    reasons.push({
      source: "rule",
      signal: "unusual_hours",
      detail: `Login at ${String(Number(signals.hour)).padStart(2, "0")}:00 UTC, outside the user's normal activity window.`,
    });
  }
  if (freq >= 6) {
    ruleRisk += 25;
    reasons.push({
      source: "rule",
      signal: "abnormal_frequency",
      detail: `${freq} successful logins in the last 24 hours — far above normal frequency.`,
    });
  }

  let alertType: AlertType | null = null;
  if (failed >= 5) alertType = "brute_force";
  else if (ip && (dev || hr || geo)) alertType = "combined_threat";
  else if (ip) alertType = "new_ip";
  else if (dev) alertType = "device_change";
  else if (brw) alertType = "browser_change";
  else if (geo) alertType = "geo_change";
  else if (hr) alertType = "unusual_hours";
  else if (freq >= 6) alertType = "abnormal_frequency";

  return { ruleRisk: Math.min(100, ruleRisk), reasons, alertType };
}

function buildInsight(
  level: RiskLevel,
  reasons: DetectionReason[],
  alertType: AlertType | null,
  mlScore: number | null,
  attempt: AttemptInput,
): string {
  const ruleReasons = reasons.filter((r) => r.source === "rule");
  const hasMl = mlScore !== null && mlScore >= 0.55;

  const lead =
    level === "high"
      ? "High-risk login detected."
      : level === "medium"
        ? "Elevated-risk login detected."
        : "Low-risk login observed.";

  const bits: string[] = [];
  if (ruleReasons.length) {
    bits.push(
      ruleReasons
        .map((r) => r.detail.replace(/\.$/, ""))
        .join(" "),
    );
  }
  if (hasMl) {
    bits.push(
      `The Isolation Forest model also flagged this session as a statistical outlier (anomaly score ${mlScore!.toFixed(2)}).`,
    );
  }
  const body = bits.length
    ? " " + bits.join(" ")
    : " No behavioural deviations were detected against the user's baseline.";

  const recommendation = recommendationFor(level, alertType);
  return `${lead}${body} Recommended action: ${recommendation}`;
}

function recommendationFor(
  level: RiskLevel,
  alertType: AlertType | null,
): string {
  if (alertType === "brute_force") {
    return "temporarily lock the account, force a credential reset, and notify the owner.";
  }
  if (level === "high") {
    return "block the session, enforce step-up MFA, and require an out-of-band identity confirmation.";
  }
  if (level === "medium") {
    return "verify the identity via secondary channel before permitting sensitive actions.";
  }
  return "no action required; continue monitoring.";
}

/**
 * Score a set of new login attempts against the existing event history.
 *
 * `existingEvents` is used to (a) build each user's behavioural baseline and
 * (b) train the Isolation Forest on historical successful logins. The attempts
 * themselves are excluded from training to avoid leakage in live operation.
 */
export function scoreAttempts(
  attempts: AttemptInput[],
  existingEvents: EventLike[],
): RiskResult[] {
  const iforest = new IsolationForest();
  const trainingRows: number[][] = [];

  for (const e of existingEvents) {
    if (e.loginStatus !== "success") continue;
    const baseline = buildBaseline(e.userId, e.timestamp, existingEvents);
    const { features } = buildFeatures(e as AttemptInput, baseline, existingEvents);
    trainingRows.push(features);
  }

  let trainScores: number[] = [];
  if (trainingRows.length > 0) {
    iforest.fit(trainingRows);
    trainScores = iforest.score(trainingRows);
  }

  return attempts.map((attempt) => {
    const baseline = buildBaseline(
      attempt.userId,
      attempt.timestamp,
      existingEvents,
    );
    const { features, signals } = buildFeatures(attempt, baseline, existingEvents);

    const mlScore = iforest.trained ? iforest.score([features])[0] : null;
    const mlRisk = mlScore === null ? 0 : anchorMlRisk(mlScore, trainScores);

    const { ruleRisk, reasons, alertType } = evaluateRules(signals, attempt);

    if (mlScore !== null && mlScore >= 0.55) {
      reasons.push({
        source: "ml",
        signal: "isolation_forest_outlier",
        detail: `Unsupervised model scored this login ${mlScore.toFixed(2)} / 1.0 on anomaly (higher = more isolated from normal behaviour).`,
      });
    }

    // Blend: rule and ML each contribute; clamp at 100.
    const blended = Math.min(100, Math.round(ruleRisk * 0.6 + mlRisk * 0.6));
    const riskScore = mlScore === null ? ruleRisk : blended;
    const riskLevel = classify(riskScore);

    const featureRecord: Record<string, number> = {};
    FEATURE_NAMES.forEach((name, i) => (featureRecord[name] = features[i]));

    return {
      riskScore,
      riskLevel,
      mlAnomalyScore: mlScore,
      mlRisk,
      ruleRisk: Math.min(100, ruleRisk),
      reasons,
      alertType,
      insight: buildInsight(riskLevel, reasons, alertType, mlScore, attempt),
      features: featureRecord,
    };
  });
}

/** Score a single attempt against the available historical events. */
export function scoreSingle(
  attempt: AttemptInput,
  existingEvents: EventLike[],
): RiskResult {
  return scoreAttempts([attempt], existingEvents)[0];
}
