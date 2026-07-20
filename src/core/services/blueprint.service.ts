import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";
import type {
  BlueprintCompareResult,
  BlueprintInput,
  BlueprintStatus,
  BlueprintVersionsList,
} from "@/types/platform";

/**
 * Blueprint Service
 *
 * Thin translation layer over the Gateway's /blueprint endpoints - the
 * first-login setup wizard plus Blueprint Versions (list/restore/compare).
 */
export const blueprintService = {
  async get<T = BlueprintStatus>(): Promise<T> {
    return gateway.get<T>(endpoints.blueprint);
  },
  async publish<T = unknown>(input: BlueprintInput): Promise<T> {
    return gateway.post<T>(endpoints.blueprint, input);
  },
  async versions<T = BlueprintVersionsList>(): Promise<T> {
    return gateway.get<T>(endpoints.blueprintVersions);
  },
  async restore<T = unknown>(version: number): Promise<T> {
    return gateway.post<T>(endpoints.blueprintRestore, { version });
  },
  async compare<T = BlueprintCompareResult>(fromVersion: number, toVersion: number): Promise<T> {
    return gateway.post<T>(endpoints.blueprintCompare, {
      from_version: fromVersion,
      to_version: toVersion,
    });
  },
};
