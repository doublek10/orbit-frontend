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

  /**
   * Compile: an on-demand, point-in-time snapshot of everything the
   * Engine currently knows - ledger findings plus whatever the
   * company's Connector URL reports live - rendered into a downloadable
   * PDF. The Engine itself doesn't need this call (it runs
   * continuously regardless); it exists purely so a person can hand
   * someone else a document. Returns the PDF as base64 rather than a
   * binary body since gateway.ts's single request() function always
   * parses JSON (Development Rule #5) - see downloadCompiledReport
   * below for turning this into an actual file download.
   */
  async compile<T = unknown>(): Promise<T> {
    return gateway.post<T>(endpoints.intelligence.compile, {});
  },
};

/**
 * Decodes a compile() response's base64 PDF into a Blob and triggers a
 * browser download - same client-side download pattern
 * ConnectorGenerator.tsx already uses for generated connector code.
 */
export function downloadCompiledReport(result: { pdf_base64: string; filename: string }): void {
  const binary = atob(result.pdf_base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename || "orbit-intelligence-report.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
