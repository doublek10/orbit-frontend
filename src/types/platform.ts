export type BlueprintPriority =
  | "cash_flow_visibility"
  | "expense_control"
  | "payroll_accuracy"
  | "fraud_and_risk_alerts"
  | "growth_forecasting";

export type IntelligenceCapability = "health" | "trend" | "spend" | "anomaly" | "forecast";

export interface Blueprint {
  business_type: string;
  priorities: BlueprintPriority[];
  large_transaction_threshold: number | null;
  notify_on_large_transaction: boolean;
  weekly_digest: boolean;
  enabled_capabilities: IntelligenceCapability[];
  allowed_categories: string[] | null;
  version: number;
  published_at: string;
}

export interface BlueprintStatus {
  onboarded: boolean;
  blueprint: Blueprint | null;
  you_can_edit: boolean;
}

export interface BlueprintInput {
  business_type: string;
  priorities: BlueprintPriority[];
  large_transaction_threshold: number | null;
  notify_on_large_transaction: boolean;
  weekly_digest: boolean;
  enabled_capabilities?: IntelligenceCapability[];
  allowed_categories?: string[] | null;
}

export interface BlueprintVersionSummary {
  version: number;
  snapshot: Blueprint;
  published_by_email: string;
  created_at: string;
}

export interface BlueprintVersionsList {
  versions: BlueprintVersionSummary[];
}

export interface BlueprintFieldDiff {
  field: string;
  from: unknown;
  to: unknown;
}

export interface BlueprintCompareResult {
  from_version: number;
  to_version: number;
  changed: BlueprintFieldDiff[];
  identical: boolean;
}

export type ProviderCategory = "bank" | "mobile_money" | "payment_gateway" | "crypto" | "custom";

export interface ConnectedProvider {
  id: string;
  provider: string;
  display_name: string;
  status: string;
  category: ProviderCategory;
  country: string | null;
  auth_method: string;
  webhook_url: string | null;
  has_credentials: boolean;
  has_signing_secret: boolean;
  has_refresh_token: boolean;
  connected_at: string;
  last_synced_at: string | null;
}

export interface CatalogProvider {
  provider: string;
  display_name: string;
  category: ProviderCategory;
  countries: string[];
  auth_method: string;
  credential_fields: string[];
  connected: boolean;
  recommended: boolean;
}

export interface ProvidersList {
  connected: ConnectedProvider[];
  categories: ProviderCategory[];
  catalog: CatalogProvider[];
}

export interface ProviderConnectInput {
  provider: string;
  display_name?: string;
  country?: string;
  credentials: Record<string, string>;
  webhook_url?: string;
  signing_secret?: string;
  refresh_token?: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderTestResult {
  ok: boolean;
  verified: "live" | "structural";
  status?: string;
  missing_fields?: string[];
  message?: string;
}

export type BusinessSystemType =
  | "payroll"
  | "accounting"
  | "inventory"
  | "crm"
  | "erp"
  | "warehouse"
  | "pos"
  | "hr"
  | "custom";

export interface ConnectedIntegration {
  id: string;
  provider: string;
  display_name: string;
  system_type: BusinessSystemType;
  status: string;
  health: "unknown" | "healthy" | "unhealthy";
  authentication: string;
  has_credentials: boolean;
  connected_at: string;
  last_synced_at: string | null;
}

export interface IntegrationCatalogEntry {
  provider: string;
  display_name: string;
  system_type: BusinessSystemType;
  auth_method: string;
  credential_fields: string[];
  connected: boolean;
  recommended: boolean;
}

export interface IntegrationsList {
  connected: ConnectedIntegration[];
  system_types: BusinessSystemType[];
  catalog: IntegrationCatalogEntry[];
}

export interface IntegrationConnectInput {
  provider: string;
  display_name?: string;
  credentials: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface IntegrationTestResult {
  ok: boolean;
  verified: "structural";
  missing_fields?: string[];
  message?: string;
}

export interface MappingFieldRule {
  source: string;
  target: string;
}

export interface DataMapping {
  id: string;
  name: string;
  field_rules: MappingFieldRule[];
  sample_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MappingsList {
  mappings: DataMapping[];
  canonical_fields: string[];
}

export interface MappingSaveInput {
  name: string;
  field_rules: MappingFieldRule[];
  sample_payload: Record<string, unknown>;
}

export interface MappingPreviewResult {
  canonical: Record<string, unknown>;
  warnings: string[];
}

export type SchemaFieldType = "string" | "number" | "boolean";

export interface SchemaValidationRule {
  field: string;
  type: SchemaFieldType;
  min?: number;
  max?: number;
  enum?: (string | number)[];
}

export interface EventSchema {
  id: string;
  event_name: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
  validation_rules: SchemaValidationRule[];
  version: number;
  updated_at: string;
}

export interface EventSchemasList {
  schemas: EventSchema[];
  example_event_names: string[];
  rule_types: SchemaFieldType[];
}

export interface EventSchemaInput {
  event_name: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
  validation_rules: SchemaValidationRule[];
}

export interface SchemaValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SchemaVersionSummary {
  version: number;
  snapshot: EventSchema;
  created_by_email: string;
  created_at: string;
}

export interface AutomationCondition {
  field: string;
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains";
  value: string | number;
}

export interface AutomationAction {
  type: "tag" | "notify";
  value?: string;
  message?: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger_event: string;
  condition: AutomationCondition | Record<string, never>;
  action: AutomationAction;
  enabled: boolean;
  source: "blueprint" | "manual";
}

export interface AutomationRun {
  id: number;
  workflow_name: string;
  trigger_event: string;
  matched_payload: Record<string, unknown>;
  action_result: Record<string, unknown>;
  created_at: string;
}

export interface WorkflowCapability {
  name: string;
  status: "available" | "planned";
  description: string;
}

export interface WorkflowsList {
  automations: Automation[];
  recent_runs: AutomationRun[];
  capabilities: WorkflowCapability[];
}
