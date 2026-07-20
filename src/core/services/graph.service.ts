import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";

/**
 * Graph Service
 *
 * Thin translation layer over the Gateway's /graph endpoint - the
 * unified ledger timeline, manual transaction entry, and CSV statement
 * import.
 */
export const graphService = {
  async timeline<T = unknown>(limit = 50, offset = 0): Promise<T> {
    return gateway.get<T>(`${endpoints.graph}?limit=${limit}&offset=${offset}`);
  },
  async importCsv<T = unknown>(csvText: string): Promise<T> {
    return gateway.post<T>(endpoints.graph, { csv_text: csvText });
  },
};
