import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";
import type {
  MappingPreviewResult,
  MappingSaveInput,
  MappingsList,
} from "@/types/platform";

/**
 * Mapping Service (Data Mapping / Visual JSON Mapper)
 *
 * Thin translation layer over the Gateway's /mappings endpoints.
 */
export const mappingService = {
  async list<T = MappingsList>(): Promise<T> {
    return gateway.get<T>(endpoints.mapping);
  },
  async save<T = unknown>(input: MappingSaveInput): Promise<T> {
    return gateway.post<T>(endpoints.mapping, input);
  },
  async delete<T = unknown>(id: string): Promise<T> {
    return gateway.post<T>(endpoints.mappingDelete, { id });
  },
  async preview<T = MappingPreviewResult>(
    input:
      | { id: string; sample_payload: Record<string, unknown> }
      | { field_rules: { source: string; target: string }[]; sample_payload: Record<string, unknown> },
  ): Promise<T> {
    return gateway.post<T>(endpoints.mappingPreview, input);
  },
};
