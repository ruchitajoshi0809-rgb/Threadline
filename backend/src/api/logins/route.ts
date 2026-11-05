import { getEvents } from "@/lib/queries";
import { json, route, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  await requireUser();
  const url = new URL(req.url);
  const riskLevel = url.searchParams.get("riskLevel") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? 25);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const result = await getEvents({
    riskLevel,
    search,
    limit: Number.isFinite(limit) ? limit : 25,
    offset: Number.isFinite(offset) ? offset : 0,
  });
  return json(result);
});
