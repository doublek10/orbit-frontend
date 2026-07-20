"use client";

import { useAuth } from "@/contexts/AuthContext";

/**
 * Thin convenience wrapper so components don't need to know the session
 * lives inside AuthContext specifically - just "frontend behaviour",
 * per Development Rule #3.
 */
export function useSession() {
  const { session, loading } = useAuth();
  return { session, loading, isAuthenticated: !!session };
}
