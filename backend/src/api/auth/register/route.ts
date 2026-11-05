import { getCollections } from "@/db";
import { MongoServerError, ObjectId } from "mongodb";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import {
  json,
  route,
  validateRegister,
  HttpError,
} from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const { username, email, password } = validateRegister(body);
  const { users } = await getCollections();
  const user = {
    _id: new ObjectId(),
    username,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role: "user" as const,
    createdAt: new Date(),
  };

  try {
    const result = await users.insertOne(user);
    const u = { ...user, _id: result.insertedId };

    if (body?.createSession !== false) {
      const token = await createSessionToken({
        sub: u._id.toHexString(),
        username: u.username,
        role: u.role,
      });
      setSessionCookie(token);
    }

    return json({
      user: {
        id: u._id.toHexString(),
        username: u.username,
        email: u.email,
        role: u.role,
      },
      message: "Account created.",
    }, 201);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const duplicateField = String(error.keyPattern?.username ? "Username" : "Email");
      throw new HttpError(
        409,
        duplicateField === "Username" ? "Username already taken." : "Email already registered.",
      );
    }
    throw error;
  }
});
