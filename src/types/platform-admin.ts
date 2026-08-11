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

/**
 * Connector Generator - the reverse direction of the SDK Generator.
 * Generates starter code that runs on the company's own side and
 * reads FROM their database (employees, invoices, inventory, payments,
 * or whatever else Orbit needs), keyed by language + database engine.
 */
export type ConnectorLanguage = "javascript" | "php" | "python" | "java";
export type ConnectorDatabase = "postgresql" | "mysql" | "mongodb" | "sqlserver" | "sqlite";

export const CONNECTOR_LANGUAGES: ConnectorLanguage[] = ["javascript", "php", "python", "java"];
export const CONNECTOR_DATABASES: ConnectorDatabase[] = [
  "postgresql",
  "mysql",
  "mongodb",
  "sqlserver",
  "sqlite",
];

export const CONNECTOR_LANGUAGE_LABELS: Record<ConnectorLanguage, string> = {
  javascript: "JavaScript (Node)",
  php: "PHP",
  python: "Python",
  java: "Java",
};

export const CONNECTOR_LANGUAGE_EXTENSIONS: Record<ConnectorLanguage, string> = {
  javascript: "js",
  php: "php",
  python: "py",
  java: "java",
};

export const CONNECTOR_DATABASE_LABELS: Record<ConnectorDatabase, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL / MariaDB",
  mongodb: "MongoDB",
  sqlserver: "SQL Server",
  sqlite: "SQLite",
};

export interface ConnectorConnectionInput {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  /**
   * Optional. The live URL of a connector file the company already
   * generated and deployed on their own hosting (e.g.
   * https://yourcompany.com/orbit-connector.php). When set, Orbit
   * calls this URL for ?entity=... reads instead of connecting to
   * host/port/database directly - this is the path for companies
   * whose database isn't reachable from Orbit but a plain URL is
   * (shared hosting, etc).
   */
  connector_url: string;
  /**
   * Optional. Only needed if the company set ORBIT_CONNECTOR_TOKEN in
   * the deployed file's environment - left blank, the connector URL
   * is called with no auth, which is the file's own default. Sent as
   * the X-Orbit-Token header.
   */
  connector_token: string;
}

export interface ConnectorTableMappingInput {
  entity: string;
  table: string;
  id_column: string;
}

export interface ConnectorGenerateResult {
  language: ConnectorLanguage;
  database: ConnectorDatabase;
  filename: string;
  code: string;
  supported_languages: ConnectorLanguage[];
  supported_databases: ConnectorDatabase[];
}

export interface ConnectorTableTestResult {
  entity: string;
  table: string;
  reachable: boolean;
  columns: string[];
  row_count: number | null;
  sample_rows: Record<string, unknown>[];
  error: string | null;
}

export interface ConnectorTestResult {
  database: ConnectorDatabase;
  connected: boolean;
  error: string | null;
  tables: ConnectorTableTestResult[];
  tested_at: string;
  saved: false;
}

/**
 * What Orbit remembers about a company's Connector Generator setup so
 * the wizard doesn't start cold on the next visit. Deliberately just
 * these three fields - never host/port/username, and never the
 * password, matching the generator's own "never persist a secret"
 * rule.
 */
export interface ConnectorPreferences {
  language: ConnectorLanguage;
  database: ConnectorDatabase;
  connector_url: string | null;
  updated_at: string;
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