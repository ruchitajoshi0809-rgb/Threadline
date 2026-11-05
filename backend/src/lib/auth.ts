import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { ObjectId } from "mongodb";
import type { User } from "@/db/schema";
import { getRequestContext } from "./requestContext.js";

const SESSION_COOKIE = "threadline_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "threadline-dev-secret-please-override",
);

export interface SessionPayload {
  sub: string;
  username: string;
  role: User["role"];
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({
    username: payload.username,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      username: String(payload.username ?? ""),
      role: (payload.role as User["role"]) ?? "user",
    };
  } catch {
    return null;
  }
}

export function toSessionSubject(id: ObjectId): string {
  return id.toHexString();
}

export function setSessionCookie(token: string): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  getRequestContext().responseCookies.push(
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
  );
}

export function clearSessionCookie(): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  getRequestContext().responseCookies.push(
    `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
  );
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookie = getRequestContext().request.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!token) return null;
  return verifySessionToken(decodeURIComponent(token));
}
