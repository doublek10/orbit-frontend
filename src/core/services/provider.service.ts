import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";
import type {
  ProviderConnectInput,
  ProviderTestResult,
  ProvidersList,
} from "@/types/platform";

/**
 * Provider Service (Financial Connections)
 *
 * Thin translation layer over the Gateway's /providers endpoints.
 */
export const providerService = {
  async list<T = ProvidersList>(): Promise<T> {
    return gateway.get<T>(endpoints.provider);
  },
  async connect<T = unknown>(input: ProviderConnectInput): Promise<T> {
    return gateway.post<T>(endpoints.provider, input);
  },
  async test<T = ProviderTestResult>(
    input: { id: string } | { provider: string; credentials: Record<string, string> },
  ): Promise<T> {
    return gateway.post<T>(endpoints.providerTest, input);
  },
  async disconnect<T = unknown>(id: string): Promise<T> {
    return gateway.post<T>(endpoints.providerDisconnect, { id });
  },
};
