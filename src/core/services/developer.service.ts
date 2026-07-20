import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";
import type {
  ApiGenerateResult,
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
};
