import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";

/**
 * Workflow Service
 *
 * Thin translation layer over the Gateway's /workflow endpoint.
 */
export const workflowService = {
  async list<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.workflow);
  },
  async create<T = unknown>(input: {
    name: string;
    trigger_event?: string;
    condition?: { field: string; op: string; value: string | number };
    action?: { type: string; value?: string; message?: string };
  }): Promise<T> {
    return gateway.post<T>(endpoints.workflow, input);
  },
};
