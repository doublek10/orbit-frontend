import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";
import type {
  ApiGenerateResult,
  ConnectorConnectionInput,
  ConnectorDatabase,
  ConnectorGenerateResult,
  ConnectorLanguage,
  ConnectorPreferences,
  ConnectorTableMappingInput,
  ConnectorTestResult,
  RotateSecretResult,
  SdkGenerateResult,
  SdkLanguage,
  TestEndpointResult,
} from "@/types/platform-admin";

/**
 * Developer Service
 *
 * Thin translation layer over the Gateway's /developer endpoint (API
 * key generation, listing, and revocation) and the Orbit API Generator
 * / SDK Generator endpoints (Company Endpoint identity, webhook secret
 * rotation, Test Console, SDK code generation).
 */
export const developerService = {
  async list<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.developer);
  },
  async createKey<T = unknown>(name: string): Promise<T> {
    return gateway.post<T>(endpoints.developer, { name });
  },
  async revokeKey<T = unknown>(keyId: string): Promise<T> {
    return gateway.post<T>(endpoints.developer, { action: "revoke", key_id: keyId });
  },
  async generateApiCredentials<T = ApiGenerateResult>(): Promise<T> {
    return gateway.post<T>(endpoints.companyApiKey, {});
  },
  async rotateWebhookSecret<T = RotateSecretResult>(): Promise<T> {
    return gateway.post<T>(endpoints.companyRotateSecret, {});
  },
  async testEndpoint<T = TestEndpointResult>(
    samplePayload: Record<string, unknown>,
    mappingId?: string,
  ): Promise<T> {
    return gateway.post<T>(endpoints.companyTestEndpoint, {
      sample_payload: samplePayload,
      mapping_id: mappingId,
    });
  },
  async generateSdk<T = SdkGenerateResult>(language: SdkLanguage): Promise<T> {
    return gateway.get<T>(endpoints.sdk(language));
  },
  async generateConnector<T = ConnectorGenerateResult>(input: {
    language: ConnectorLanguage;
    database: ConnectorDatabase;
    filename?: string;
    connection: ConnectorConnectionInput;
    tables: ConnectorTableMappingInput[];
  }): Promise<T> {
    return gateway.post<T>(endpoints.connectorGenerate, input);
  },
  async testConnector<T = ConnectorTestResult>(input: {
    database: ConnectorDatabase;
    connection: ConnectorConnectionInput;
    tables: ConnectorTableMappingInput[];
  }): Promise<T> {
    return gateway.post<T>(endpoints.connectorTest, input);
  },
  async getConnectorPreferences<T = { preferences: ConnectorPreferences | null }>(): Promise<T> {
    return gateway.get<T>(endpoints.connectorPreferences);
  },
  async saveConnectorPreferences<T = { preferences: ConnectorPreferences }>(input: {
    language: ConnectorLanguage;
    database: ConnectorDatabase;
    connector_url?: string | null;
  }): Promise<T> {
    return gateway.post<T>(endpoints.connectorPreferences, input);
  },
  async deleteConnectorPreferences<T = { deleted: boolean }>(): Promise<T> {
    return gateway.delete<T>(endpoints.connectorPreferences);
  },
};