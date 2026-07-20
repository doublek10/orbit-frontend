import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";

/**
 * Intelligence Service
 *
 * Thin translation layer over the Gateway's /intelligence/* endpoints,
 * which relay to the Kernel's Intelligence Engine
 * (kernel/intelligence_engine/). The Engine runs continuously in the
 * background - nothing here triggers analysis, it only reads what the
 * Engine has already produced (or writes preferences/read-state).
 */
function withQuery(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return path;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

export const intelligenceService = {
  async dashboard<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.intelligence.dashboard);
  },

  async reports<T = unknown>(params?: { report_type?: string; limit?: number }): Promise<T> {
    return gateway.get<T>(withQuery(endpoints.intelligence.reports, params));
  },

  async notifications<T = unknown>(params?: { unread_only?: boolean; limit?: number }): Promise<T> {
    return gateway.get<T>(withQuery(endpoints.intelligence.notifications, params));
  },

  async markNotificationRead<T = unknown>(id: string): Promise<T> {
    return gateway.post<T>(endpoints.intelligence.notifications, { id });
  },

  async forecast<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.intelligence.forecast);
  },

  async performance<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.intelligence.performance);
  },

  async knowledge<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.intelligence.knowledge);
  },

  async history<T = unknown>(metricKey: string, limit?: number): Promise<T> {
    return gateway.get<T>(withQuery(endpoints.intelligence.history, { metric_key: metricKey, limit }));
  },

  async status<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.intelligence.status);
  },

  async getPreferences<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.intelligence.preferences);
  },

  async setPreferences<T = unknown>(payload: {
    daily_summary?: boolean;
    weekly_executive?: boolean;
    monthly_forecast?: boolean;
    min_notification_severity?: "info" | "warning" | "critical";
  }): Promise<T> {
    return gateway.post<T>(endpoints.intelligence.preferences, payload);
  },
};
