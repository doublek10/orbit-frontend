import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";
import type { SecurityOverview } from "@/types/platform-admin";

/**
 * Security Service
 *
 * Thin translation layer over the Gateway's /security endpoint - a
 * read-only consolidated view. Mutations (rotate secret, revoke key)
 * stay in developerService, which already owns them.
 */
export const securityService = {
  async overview<T = SecurityOverview>(): Promise<T> {
    return gateway.get<T>(endpoints.security);
  },
};
