import { NextRequest, NextResponse } from "next/server";

/**
 * This is a UX convenience only: it checks whether the Gateway's session
 * cookie is *present* so we can bounce straight to /login instead of
 * flashing a protected page first. It cannot and does not verify the
 * cookie's signature (that would require SESSION_SECRET, which this app
 * never has access to). Real enforcement happens on every request at the
 * Gateway, in orbit-gateway/middleware.ts and requireSession().
 */

const PROTECTED_PREFIXES = [
  "/overview",
  "/settings",
  "/developer",
  "/marketplace",
  "/enterprise",
  "/onboarding",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSessionCookie = req.cookies.has("orbit_session");
  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/overview/:path*",
    "/settings/:path*",
    "/developer/:path*",
    "/marketplace/:path*",
    "/enterprise/:path*",
    "/onboarding/:path*",
  ],
};
