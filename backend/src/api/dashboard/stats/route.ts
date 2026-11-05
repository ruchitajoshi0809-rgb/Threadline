import { getStats } from "@/lib/queries";
import { json, route, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireUser();
  const stats = await getStats();
  return json(stats);
});
