import { getUsersWithStats } from "@/lib/queries";
import { json, route, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const users = await getUsersWithStats();
  return json({ users });
});
