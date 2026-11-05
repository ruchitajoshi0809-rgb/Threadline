import { getCollections } from "@/db";
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { json, route, validateLogin, HttpError } from "@/lib/api";
import { SAMPLE_ACCOUNT_EMAILS } from "@/lib/sampleAccounts";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const { username, password } = validateLogin(body);
  const { users } = await getCollections();
  const u = await users.findOne({ username });

  if (!u || SAMPLE_ACCOUNT_EMAILS.includes(u.email.toLowerCase())) {
    throw new HttpError(401, "Invalid credentials.");
  }
  const ok = await verifyPassword(password, u.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid credentials.");

  const token = await createSessionToken({
    sub: u._id.toHexString(),
    username: u.username,
    role: u.role,
  });
  await setSessionCookie(token);

  return json({
    user: {
      id: u._id.toHexString(),
      username: u.username,
      email: u.email,
      role: u.role,
    },
  });
});
