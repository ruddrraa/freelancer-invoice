import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { env, requireEnv } from "@/lib/env";

const COOKIE_NAME = "fi_token";

export type JwtPayload = {
  userId: string;
  email: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload) {
  const secret = env.JWT_SECRET ?? requireEnv("JWT_SECRET");
  const expiresIn = env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"];
  return jwt.sign(payload, secret, {
    expiresIn,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = env.JWT_SECRET ?? requireEnv("JWT_SECRET");
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest) {
  return req.cookies.get(COOKIE_NAME)?.value ?? null;
}

export function getAuthPayload(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }
  return verifyToken(token);
}

export const authCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export const authCookieName = COOKIE_NAME;
