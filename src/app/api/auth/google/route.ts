import { NextRequest } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { authCookieName, authCookieOptions, signToken } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/api";
import User from "@/models/User";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!env.GOOGLE_CLIENT_ID) {
    return fail("Google OAuth is not configured", 400);
  }

  const body = await req.json();
  const token = body?.credential;
  if (!token) {
    return fail("Missing Google credential", 422);
  }

  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) {
    return fail("Unable to verify Google identity", 401);
  }

  await connectDb();

  let user = await User.findOne({ email: payload.email.toLowerCase() });
  if (!user) {
    user = await User.create({
      name: payload.name ?? payload.email.split("@")[0],
      email: payload.email.toLowerCase(),
      oauthProviders: { googleSub: payload.sub },
    });
  }

  const jwtToken = signToken({ userId: String(user._id), email: user.email });
  const response = ok({ user: { id: String(user._id), name: user.name, email: user.email } });
  response.cookies.set(authCookieName, jwtToken, authCookieOptions);
  return response;
}
