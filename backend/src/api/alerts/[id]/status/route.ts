import { getCollections } from "@/db";
import { ObjectId } from "mongodb";
import { json, route, requireUser, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const PATCH = route(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireUser();
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) throw new HttpError(400, "Invalid alert id.");
    const alertId = new ObjectId(id);

    const body = await req.json().catch(() => ({}));
    const status = String(body?.status ?? "");
    if (
      status !== "open" &&
      status !== "reviewed" &&
      status !== "dismissed"
    )
      throw new HttpError(400, "Status must be open, reviewed or dismissed.");

    const { securityAlerts } = await getCollections();
    const updated = await securityAlerts.findOneAndUpdate(
      { _id: alertId },
      { $set: { status } },
      { returnDocument: "after", projection: { status: 1 } },
    );

    if (!updated) throw new HttpError(404, "Alert not found.");
    return json({
      ok: true,
      alert: { id: updated._id.toHexString(), status: updated.status },
    });
  },
);
