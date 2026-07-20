import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";
import type {
  EventSchemaInput,
  EventSchemasList,
  SchemaValidateResult,
} from "@/types/platform";

/**
 * Schema Service (Event Schema Builder)
 *
 * Thin translation layer over the Gateway's /schema endpoints.
 */
export const schemaService = {
  async list<T = EventSchemasList>(): Promise<T> {
    return gateway.get<T>(endpoints.schema);
  },
  async save<T = unknown>(input: EventSchemaInput): Promise<T> {
    return gateway.post<T>(endpoints.schema, input);
  },
  async delete<T = unknown>(id: string): Promise<T> {
    return gateway.post<T>(endpoints.schemaDelete, { id });
  },
  async validate<T = SchemaValidateResult>(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<T> {
    return gateway.post<T>(endpoints.schemaValidate, { id, payload });
  },
  async versions<T = { versions: unknown[] }>(id: string): Promise<T> {
    return gateway.post<T>(endpoints.schemaVersions, { id });
  },
};
