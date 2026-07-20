import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";

/**
 * Dashboard Service
 *
 * Thin translation layer over the Gateway's /dashboard endpoint. The
 * endpoint itself returns 501 until the Kernel's Workflow Engine
 * implements this capability - this service already has the right shape
 * so pages can be wired up now and start working the moment the backend
 * catches up, with no frontend changes required.
 */
export const dashboardService = {
  async overview<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.dashboard);
  },
};
