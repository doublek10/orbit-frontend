import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";

/**
 * Marketplace Service
 *
 * Thin translation layer over the Gateway's /marketplace endpoint.
 */
export const marketplaceService = {
  async list<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.marketplace);
  },
  async toggle<T = unknown>(appKey: string, action: "install" | "uninstall"): Promise<T> {
    return gateway.post<T>(endpoints.marketplace, { app_key: appKey, action });
  },
};
