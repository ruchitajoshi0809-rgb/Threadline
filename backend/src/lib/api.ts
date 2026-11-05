import { getSession, type SessionPayload } from "./auth.js";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function getMongoErrorMessage(error: unknown): string | null {
  const pending: unknown[] = [error];
  const visited = new Set<object>();
  const codes = new Set<string>();
  const names = new Set<string>();
  const messages: string[] = [];

  while (pending.length > 0) {
    const current = pending.pop();
    if (typeof current !== "object" || current === null || visited.has(current)) {
      continue;
    }

    visited.add(current);
    if ("name" in current && typeof current.name === "string") {
      names.add(current.name);
    }
    if ("message" in current && typeof current.message === "string") {
      messages.push(current.message);
    }
    if ("code" in current && current.code !== undefined) {
      codes.add(String(current.code));
    }
    if ("cause" in current) pending.push(current.cause);
    if ("errors" in current && Array.isArray(current.errors)) {
      pending.push(...current.errors);
    }
  }

  if (
    ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "ECONNABORTED"].some(
      (code) => codes.has(code),
    ) ||
    names.has("MongoServerSelectionError") ||
    names.has("MongoNetworkError") ||
    messages.some((message) => message.toLowerCase().includes("server selection"))
  ) {
    return "MongoDB is unavailable. Check MONGODB_URI and your Atlas network access settings.";
  }
  if (codes.has("18") || codes.has("AuthenticationFailed")) {
    return "MongoDB rejected the credentials in MONGODB_URI. Check the database username and password.";
  }
  if (codes.has("11000")) {
    return "A record with the same unique value already exists.";
  }

  return null;
}

export async function requireUser(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Authentication required");
  return s;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const s = await requireUser();
  if (s.role !== "admin") {
    throw new HttpError(403, "Administrator access required");
  }
  return s;
}

type Handler = (...args: any[]) => Promise<Response>;

/** Wrap a route handler so HttpError and unexpected errors become JSON. */
export function route(fn: Handler): Handler {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      const mongoMessage = getMongoErrorMessage(e);
      if (mongoMessage) return json({ error: mongoMessage }, 503);
      console.error("[api-error]", e);
      return json({ error: "Internal server error" }, 500);
    }
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(body: any) {
  const username = String(body?.username ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "");
  const errors: string[] = [];
  if (username.length < 3) errors.push("Username must be at least 3 characters.");
  if (!EMAIL_RE.test(email)) errors.push("A valid email is required.");
  if (password.length < 8)
    errors.push("Password must be at least 8 characters.");
  if (errors.length) throw new HttpError(400, errors.join(" "));
  return { username, email, password };
}

export function validateLogin(body: any) {
  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");
  if (!username || !password)
    throw new HttpError(400, "Username and password are required.");
  return { username, password };
}
