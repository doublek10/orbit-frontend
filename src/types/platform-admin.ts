export interface CompanyMember {
  email: string;
  full_name: string | null;
  role: string;
  joined_at: string;
}

export interface CompanyOverview {
  company: { id: string; name: string | null; country: string | null };
  you: { email: string | null; role: string | null; permissions: string[] };
  members: CompanyMember[];
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

export interface DeveloperKeysList {
  api_keys: ApiKey[];
}

export interface CreatedApiKey {
  api_key: ApiKey & { secret: string };
}

export interface CompanyEndpointInfo {
  endpoint_slug: string;
  endpoint_url: string;
  rate_limit_per_minute: number;
  created_at: string;
  rotated_at: string | null;
}

export interface ApiGenerateResult {
  endpoint: CompanyEndpointInfo;
  api_key: ApiKey & { secret: string };
  webhook_secret: string | null;
}

export interface RotateSecretResult {
  endpoint: CompanyEndpointInfo;
  webhook_secret: string;
}

export interface TestEndpointResult {
  raw_body: string;
  signature: string;
  request_id: string;
  signature_verified: boolean;
  mapping_preview?: { canonical: Record<string, unknown>; warnings: string[] };
}

export type SdkLanguage = "typescript" | "javascript" | "php" | "python" | "java";

export interface SdkGenerateResult {
  language: SdkLanguage;
  code: string;
  supported_languages: SdkLanguage[];
}

export interface SecurityApiKeySummary {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

export interface SecurityMember {
  email: string;
  role: string;
  permissions: string[];
}

export interface SecurityActivityEntry {
  action: string;
  metadata: Record<string, unknown>;
  actor_email: string | null;
  created_at: string;
}

export interface SecurityOverview {
  api_keys: { active: SecurityApiKeySummary[]; revoked: SecurityApiKeySummary[] };
  webhook_secret: { configured: boolean; rotated_at: string | null; created_at: string | null };
  certificate_status: { status: "valid" | "invalid" | "not_configured"; detail: string };
  ownership: { members: SecurityMember[] };
  recent_activity: SecurityActivityEntry[];
  you: { role: string; can_edit: boolean };
}
