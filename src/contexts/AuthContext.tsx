"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "@/core/services/auth.service";
import type { Session } from "@/types/session";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, companyName: string, country?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const current = await authService.getSession();
      setSession(current);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const newSession = await authService.login(email, password);
    setSession(newSession);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, companyName: string, country?: string) => {
      const newSession = await authService.signUp(email, password, companyName, country);
      setSession(newSession);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, login, signUp, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
