import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";
import type {
  IntegrationConnectInput,
  IntegrationsList,
  IntegrationTestResult,
} from "@/types/platform";

/**
 * Integration Service (Business Systems)
 *
 * Thin translation layer over the Gateway's /integrations endpoints -
 * the Connection Manager for payroll, accounting, inventory, CRM, ERP,
 * warehouse, POS, and HR systems.
 */
export const integrationService = {
  async list<T = IntegrationsList>(): Promise<T> {
    return gateway.get<T>(endpoints.integration);
  },
  async connect<T = unknown>(input: IntegrationConnectInput): Promise<T> {
    return gateway.post<T>(endpoints.integration, input);
  },
  async test<T = IntegrationTestResult>(
    input: { id: string } | { provider: string; credentials: Record<string, string> },
  ): Promise<T> {
    return gateway.post<T>(endpoints.integrationTest, input);
  },
  async disconnect<T = unknown>(id: string): Promise<T> {
    return gateway.post<T>(endpoints.integrationDisconnect, { id });
  },
};
