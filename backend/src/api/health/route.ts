import { connectDatabase } from "@/db";
import { getMongoErrorMessage } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await connectDatabase();
    await db.command({ ping: 1 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[health-check]", error);
    return Response.json(
      {
        ok: false,
        error:
          getMongoErrorMessage(error) ??
          "Database health check failed. Check the backend logs.",
      },
      { status: 503 },
    );
  }
}
