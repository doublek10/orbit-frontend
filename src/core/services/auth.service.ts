import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";
import type { Session, SessionResponse } from "@/types/session";

/**
 * The Frontend never talks to Supabase - it never did anything but
 * collect input. Signup and login are plain submissions to the Gateway,
 * which forwards them to the Kernel; the Kernel is the only component in
 * the whole platform that calls Supabase. This file's only job is
 * shaping the HTTP calls through gateway.ts (Development Rule #5).
 */
export const authService = {
  async login(email: string, password: string): Promise<Session> {
    const result = await gateway.post<{ session: Session }>(endpoints.auth.login, {
      email,
      password,
    });
    return result.session;
  },

  async signUp(email: string, password: string, companyName: string, country?: string): Promise<Session> {
    const result = await gateway.post<{ session: Session }>(endpoints.auth.signup, {
      email,
      password,
      company_name: companyName,
      country,
    });
    return result.session;
  },

  async logout(): Promise<void> {
    await gateway.post(endpoints.auth.logout);
  },

  async getSession(): Promise<Session | null> {
    const result = await gateway.get<SessionResponse>(endpoints.auth.session);
    return result.session;
  },
};
