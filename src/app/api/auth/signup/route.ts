import { NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { authCookieName, authCookieOptions, hashPassword, signToken } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validation";
import User from "@/models/User";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const limiter = rateLimit(req, "auth:signup", 20);
  if (!limiter.allowed) {
    return fail("Too many requests", 429);
  }

  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid signup payload", 422, parsed.error.flatten());
  }

  await connectDb();

  const exists = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (exists) {
    return fail("User already exists", 409);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await User.create({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    passwordHash,
  });

  const token = signToken({ userId: String(user._id), email: user.email });
  const response = ok({ user: { id: String(user._id), name: user.name, email: user.email } }, 201);
  response.cookies.set(authCookieName, token, authCookieOptions);
  return response;
}
