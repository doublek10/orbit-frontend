import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";

/**
 * Company Service
 *
 * Thin translation layer over the Gateway's /companies endpoint.
 */
export const companyService = {
  async list<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.company);
  },
  async addMember<T = unknown>(email: string, role: string = "member"): Promise<T> {
    return gateway.post<T>(endpoints.company, { email, role });
  },
};
