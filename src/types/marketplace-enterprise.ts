export interface MarketplaceApp {
  app_key: string;
  name: string;
  category: string;
  description: string;
  installed: boolean;
  installed_at: string | null;
  recommended: boolean;
}

export interface MarketplaceList {
  apps: MarketplaceApp[];
}

export interface EnterpriseSummary {
  members: number;
  active_keys: number;
  automations: number;
  installed_apps: number;
  connections: number;
}

export interface AuditEntry {
  actor_email: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EnterpriseOverview {
  summary: EnterpriseSummary;
  audit_trail: AuditEntry[];
}
