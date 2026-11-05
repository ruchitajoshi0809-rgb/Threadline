export interface Overview {
  total: number;
  successful: number;
  failed: number;
  suspicious: number;
  highRisk: number;
  openAlerts: number;
}

export interface ActivityPoint {
  date: string;
  success: number;
  failed: number;
}

export interface DistPoint {
  level: string;
  count: number;
}

export interface AlertRow {
  id: string;
  alertType: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
  eventId: string;
  username: string | null;
  ipAddress: string | null;
  riskScore: number | null;
  riskLevel: string | null;
}

export interface Insight {
  id: string;
  text: string;
  severity: string;
  username: string | null;
  ipAddress: string | null;
  riskScore: number | null;
}

export interface ModelInfo {
  algorithm: string;
  features: string[];
  note: string;
}

export interface DashboardStats {
  overview: Overview;
  activity: ActivityPoint[];
  riskDistribution: DistPoint[];
  recentAlerts: AlertRow[];
  insights: Insight[];
  model: ModelInfo;
}

export interface EventRow {
  id: string;
  userId: string;
  timestamp: string;
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

export interface RiskAnalysis {
  distribution: DistPoint[];
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

export interface UserStat {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  totalLogins: number;
  failedLogins: number;
  suspiciousLogins: number;
  highRiskLogins: number;
  lastLogin: string | null;
  avgRisk: number;
}
