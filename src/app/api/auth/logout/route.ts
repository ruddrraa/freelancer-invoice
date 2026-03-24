import { NextRequest } from "next/server";
import { authCookieName } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function POST(_: NextRequest) {
  const response = ok({ message: "Logged out" });
  response.cookies.set(authCookieName, "", {
    expires: new Date(0),
    path: "/",
  });
  return response;
}
