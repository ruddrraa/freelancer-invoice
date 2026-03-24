import { NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import {
  authCookieName,
  authCookieOptions,
  signToken,
  verifyPassword,
} from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";
import User from "@/models/User";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const limiter = rateLimit(req, "auth:login", 40);
  if (!limiter.allowed) {
    return fail("Too many requests", 429);
  }

  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid login payload", 422, parsed.error.flatten());
  }

  await connectDb();
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user?.passwordHash) {
    return fail("Invalid credentials", 401);
  }

  const isMatch = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!isMatch) {
    return fail("Invalid credentials", 401);
  }

  const token = signToken({ userId: String(user._id), email: user.email });
  const response = ok({ user: { id: String(user._id), name: user.name, email: user.email } });
  response.cookies.set(authCookieName, token, authCookieOptions);
  return response;
}
