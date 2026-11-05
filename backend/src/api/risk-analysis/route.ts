import { getRiskAnalysis } from "@/lib/queries";
import { json, route, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireUser();
  const analysis = await getRiskAnalysis();
  return json(analysis);
});
