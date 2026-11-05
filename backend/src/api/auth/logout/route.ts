import { clearSessionCookie } from "@/lib/auth";
import { json, route } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = route(async () => {
  await clearSessionCookie();
  return json({ ok: true });
});
