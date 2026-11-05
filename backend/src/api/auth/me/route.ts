import { getCollections } from "@/db";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { json, route } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const session = await getSession();
  if (!session) return json({ user: null });

  if (!ObjectId.isValid(session.sub)) return json({ user: null });
  const { users } = await getCollections();
  const u = await users.findOne(
    { _id: new ObjectId(session.sub) },
    { projection: { passwordHash: 0 } },
  );

  if (!u) return json({ user: null });
  return json({
    user: {
      id: u._id.toHexString(),
      username: u.username,
      email: u.email,
      role: u.role,
    },
  });
});
