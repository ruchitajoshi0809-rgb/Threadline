import type { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: Date;
}

export type NewUser = Omit<User, "_id">;

export interface LoginEvent {
  _id: ObjectId;
  userId: ObjectId;
  timestamp: Date;
  ipAddress: string;
  device: string;
  browser: string;
  location: string;
  loginStatus: "success" | "failed";
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  detectionReasons: string | null;
  mlAnomalyScore: number | null;
  isSimulated?: boolean;
  isDemo?: boolean;
  createdAt: Date;
}

export type NewLoginEvent = Omit<LoginEvent, "_id">;

export interface SecurityAlert {
  _id: ObjectId;
  eventId: ObjectId;
  alertType: string;
  description: string;
  severity: "low" | "medium" | "high";
  status: "open" | "reviewed" | "dismissed";
  createdAt: Date;
}

export type NewSecurityAlert = Omit<SecurityAlert, "_id">;
