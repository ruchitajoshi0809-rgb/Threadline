import { createHash } from "node:crypto";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import type { LoginEvent, SecurityAlert, User } from "../db/schema.js";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

const DEMO_PASSWORD = "ThreadlineDemo2026!";
const ACCOUNTS = [
  {
    username: "demo-admin",
    email: "demo.admin@threadline.local",
    role: "admin",
  },
  {
    username: "demo-analyst",
    email: "demo.analyst@threadline.local",
    role: "user",
  },
] as const;

const EVENT_SCENARIOS = [
  { riskScore: 18, riskLevel: "low", status: "success" },
  { riskScore: 34, riskLevel: "low", status: "success" },
  { riskScore: 63, riskLevel: "medium", status: "success" },
  { riskScore: 91, riskLevel: "high", status: "failed" },
  { riskScore: 55, riskLevel: "medium", status: "success" },
  { riskScore: 27, riskLevel: "low", status: "success" },
  { riskScore: 87, riskLevel: "high", status: "failed" },
  { riskScore: 71, riskLevel: "medium", status: "failed" },
] as const;

const LOCATIONS = [
  "San Francisco, US",
  "London, UK",
  "Singapore",
  "Frankfurt, DE",
  "Toronto, CA",
] as const;
const DEVICES = ["MacBook Pro", "Windows Workstation", "iPhone 15"] as const;
const BROWSERS = ["Chrome 128", "Safari 18", "Firefox 130"] as const;

function demoObjectId(key: string): ObjectId {
  const hex = createHash("sha256").update(`threadline-demo:${key}`).digest("hex");
  return new ObjectId(hex.slice(0, 24));
}

async function seedDemo(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seeding is disabled in production.");
  }
  if (process.env.DEMO_MODE !== "true") {
    throw new Error("Set DEMO_MODE=true in the root .env before seeding demo data.");
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required. Add it to the project root .env file.");
  }

  const { getCollections } = await import("../db/index.js");
  const { db, users, loginEvents, securityAlerts } = await getCollections();

  try {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const userIds = new Map<string, ObjectId>();
    for (const account of ACCOUNTS) {
      const id = demoObjectId(`user:${account.username}`);
      const user: User = {
        _id: id,
        username: account.username,
        email: account.email,
        passwordHash,
        role: account.role,
        createdAt: new Date(),
      };
      await users.updateOne(
        { email: account.email },
        { $set: { username: user.username, passwordHash, role: user.role }, $setOnInsert: { _id: id, createdAt: user.createdAt } },
        { upsert: true },
      );
      const storedUser = await users.findOne({ email: account.email });
      if (!storedUser) {
        throw new Error(`Failed to create demo user "${account.username}".`);
      }
      userIds.set(account.username, storedUser._id);
    }

    const now = new Date();
    const events: LoginEvent[] = Array.from({ length: 32 }, (_, index) => {
      const scenario = EVENT_SCENARIOS[index % EVENT_SCENARIOS.length];
      const username = index % 3 === 0 ? ACCOUNTS[1].username : ACCOUNTS[0].username;
      const timestamp = new Date(
        now.getTime() -
          (index % 14) * 24 * 60 * 60 * 1000 -
          (index % 10) * 37 * 60 * 1000,
      );
      const isHighRisk = scenario.riskLevel === "high";
      const detectionReasons = isHighRisk
        ? [
            {
              source: "rule",
              signal: "new_ip",
              detail: "Login attempt came from an unfamiliar network.",
            },
            {
              source: "rule",
              signal: "unusual_hours",
              detail: "Login attempt occurred outside the usual activity window.",
            },
          ]
        : scenario.riskLevel === "medium"
          ? [
              {
                source: "rule",
                signal: "location_changed",
                detail: "Login location differs from the recent baseline.",
              },
            ]
          : [];

      return {
        _id: demoObjectId(`event:${index}`),
        userId: userIds.get(username)!,
        timestamp,
        ipAddress: `198.51.100.${20 + (index % 70)}`,
        device: DEVICES[index % DEVICES.length],
        browser: BROWSERS[(index + 1) % BROWSERS.length],
        location: LOCATIONS[index % LOCATIONS.length],
        loginStatus: scenario.status,
        riskScore: scenario.riskScore,
        riskLevel: scenario.riskLevel,
        detectionReasons: JSON.stringify(detectionReasons),
        mlAnomalyScore: scenario.riskScore / 100,
        isSimulated: true,
        isDemo: true,
        createdAt: timestamp,
      } as LoginEvent;
    });

    await loginEvents.bulkWrite(
      events.map((event) => ({
        updateOne: {
          filter: { _id: event._id },
          update: { $set: event },
          upsert: true,
        },
      })),
    );

    const alerts: SecurityAlert[] = events
      .filter((event) => event.riskLevel === "high" || event.riskLevel === "medium")
      .map((event) => ({
        _id: demoObjectId(`alert:${event._id.toHexString()}`),
        eventId: event._id,
        alertType: event.riskLevel === "high" ? "combined_threat" : "geo_change",
        description:
          event.riskLevel === "high"
            ? "Unusual sign-in behavior detected across network and time signals."
            : "Sign-in location differs from the recent user baseline.",
        severity: event.riskLevel,
        status: event.riskLevel === "high" ? "open" : "reviewed",
        createdAt: event.timestamp,
      }));

    await securityAlerts.bulkWrite(
      alerts.map((alert) => ({
        updateOne: {
          filter: { eventId: alert.eventId },
          update: { $set: alert },
          upsert: true,
        },
      })),
    );

    console.log("Demo presentation data is ready.");
    console.log(`Accounts: ${ACCOUNTS.map((account) => account.username).join(", ")}`);
    console.log(`Seeded ${events.length} simulated login events and ${alerts.length} alerts.`);
  } finally {
    await db.client.close();
  }
}

seedDemo().catch((error: unknown) => {
  console.error("Demo data seeding failed:", error);
  process.exitCode = 1;
});
