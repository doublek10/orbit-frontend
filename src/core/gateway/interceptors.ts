"use client";

/**
 * Central place to react to cross-cutting response conditions. Today: if
 * any Gateway call comes back 401, the session cookie has expired or was
 * revoked - bounce to login rather than making every service handle it.
 */
export function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.href = "/login";
}
