import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";

/**
 * Enterprise Service
 *
 * Thin translation layer over the Gateway's /enterprise endpoint
 * (audit trail and compliance summary).
 */
export const enterpriseService = {
  async overview<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.enterprise);
  },
};
