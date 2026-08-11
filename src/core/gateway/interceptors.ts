"use client";

/**
 * Central place to react to cross-cutting response conditions.
 *
 * A 401 simply means the current request does not have a valid session.
 * During signup/login the browser may briefly be waiting for the Gateway
 * session cookie to become available, so we avoid forcing an immediate
 * redirect while the user is already inside the authentication flow.
 */
export function handleUnauthorized(): void {
  if (typeof window === "undefined") return;

  const PUBLIC_ROUTES = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  const current = window.location.pathname;

  // Already on a public authentication page.
  // Don't redirect again.
  if (PUBLIC_ROUTES.some((route) => current.startsWith(route))) {
    return;
  }

  // Replace instead of push so Back doesn't immediately hit
  // another unauthorized page.
  window.location.replace("/login");
}
