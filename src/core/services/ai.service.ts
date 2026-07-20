import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";

/**
 * AI Service
 *
 * Thin translation layer over the Gateway's /ai endpoint (statistical
 * insights generated from the Financial Graph).
 */
export const aiService = {
  async insights<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.ai);
  },
};
