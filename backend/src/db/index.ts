import { MongoClient, type Collection, type Db } from "mongodb";
import type { LoginEvent, SecurityAlert, User } from "./schema.js";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is required. Add it to the project root .env file.");
}

const databaseName = process.env.MONGODB_DB || "threadline";

const globalForMongo = globalThis as typeof globalThis & {
  __threadlineMongoClient?: MongoClient;
  __threadlineMongoConnection?: Promise<Db>;
};

const client =
  globalForMongo.__threadlineMongoClient ??
  new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });

if (process.env.NODE_ENV !== "production") {
  globalForMongo.__threadlineMongoClient = client;
}

export function connectDatabase(): Promise<Db> {
  if (!globalForMongo.__threadlineMongoConnection) {
    globalForMongo.__threadlineMongoConnection = client
      .connect()
      .then(async (connectedClient) => {
        const database = connectedClient.db(databaseName);
        await Promise.all([
          database
            .collection<User>("users")
            .createIndex({ username: 1 }, { unique: true }),
          database
            .collection<User>("users")
            .createIndex({ email: 1 }, { unique: true }),
          database
            .collection<LoginEvent>("login_events")
            .createIndex({ userId: 1, timestamp: -1 }),
          database
            .collection<LoginEvent>("login_events")
            .createIndex({ riskLevel: 1, timestamp: -1 }),
          database
            .collection<SecurityAlert>("security_alerts")
            .createIndex({ status: 1, createdAt: -1 }),
          database
            .collection<SecurityAlert>("security_alerts")
            .createIndex({ eventId: 1 }, { unique: true }),
        ]);
        return database;
      })
      .catch((error: unknown) => {
        globalForMongo.__threadlineMongoConnection = undefined;
        throw error;
      });
  }
  return globalForMongo.__threadlineMongoConnection;
}

export async function getCollections(): Promise<{
  db: Db;
  users: Collection<User>;
  loginEvents: Collection<LoginEvent>;
  securityAlerts: Collection<SecurityAlert>;
}> {
  const database = await connectDatabase();
  return {
    db: database,
    users: database.collection<User>("users"),
    loginEvents: database.collection<LoginEvent>("login_events"),
    securityAlerts: database.collection<SecurityAlert>("security_alerts"),
  };
}
