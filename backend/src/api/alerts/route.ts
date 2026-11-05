import { getAlerts } from "@/lib/queries";
import { json, route, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  await requireUser();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const severity = url.searchParams.get("severity") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? 50);

  const result = await getAlerts({
    status,
    severity,
    limit: Number.isFinite(limit) ? limit : 50,
  });
  return json(result);
});
