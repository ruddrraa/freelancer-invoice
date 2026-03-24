import { NextRequest, NextResponse } from "next/server";
import { authCookieName, verifyToken } from "@/lib/auth";

const protectedPaths = ["/dashboard", "/invoices", "/settings"];
const authPaths = ["/login", "/signup"];

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = req.cookies.get(authCookieName)?.value;
  const payload = token ? verifyToken(token) : null;
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage && payload) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/invoices/:path*", "/settings/:path*", "/login", "/signup"],
};
