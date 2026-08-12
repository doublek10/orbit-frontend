export type IntelligenceSeverity = "info" | "warning" | "critical";

export interface IntelligenceFinding {
  id: string;
  kind: string;
  severity: IntelligenceSeverity;
  title: string;
  message: string;
  data: Record<string, unknown>;
}

export interface IntelligenceStatus {
  company_id: string;
  active: boolean;
  activated_at: string | null;
  deactivated_at: string | null;
  blueprint_version: number | null;
  last_event_at: string | null;
  last_cycle_at: string | null;
}

export interface IntelligenceHealth {
  score: number;
  label: "strong" | "watch" | "at risk";
  signals: string[];
}

export interface IntelligenceDashboardResponse {
  status: IntelligenceStatus;
  summary: Record<string, number>;
  health: IntelligenceHealth;
  findings: IntelligenceFinding[];
  forecast: {
    daily_net_avg: number;
    projected_balance: Record<string, number>;
    method: string;
  };
  connector: IntelligenceConnectorContext;
  unread_notifications: number;
  open_recommendations: number;
}

export interface IntelligenceNotification {
  id: string;
  category: string;
  severity: IntelligenceSeverity;
  title: string;
  message: string;
  data: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

export interface IntelligenceNotificationsResponse {
  notifications: IntelligenceNotification[];
}

export interface IntelligenceReport {
  id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  data: Record<string, unknown>;
}

export interface IntelligenceReportsResponse {
  reports: IntelligenceReport[];
}

export interface IntelligencePreferences {
  company_id: string;
  daily_summary: boolean;
  weekly_executive: boolean;
  monthly_forecast: boolean;
  min_notification_severity: IntelligenceSeverity;
}

export interface ConnectorEntitySummary {
  entity: string;
  kind: string;
  reachable: boolean;
  row_count: number;
  error: string | null;
  summary: Record<string, unknown>;
  fields: string[];
}

export interface ConnectorRelationship {
  from_entity: string;
  field: string;
  likely_target_entity: string;
}

export interface IntelligenceConnectorContext {
  connected: boolean;
  connector_url: string | null;
  reason: string | null;
  discovered: boolean;
  entities: ConnectorEntitySummary[];
  relationships: ConnectorRelationship[];
  checked_at: string;
}

export interface IntelligenceCompileResponse {
  report: {
    company: { id: string; name: string | null; country: string | null };
    generated_at: string;
    status: IntelligenceStatus;
    summary: Record<string, number>;
    health: IntelligenceHealth;
    forecast: IntelligenceDashboardResponse["forecast"];
    findings: IntelligenceFinding[];
    connector: IntelligenceConnectorContext;
    knowledge_highlights: Array<{
      from: { type: string; key: string };
      relationship: string;
      to: { type: string; key: string };
      weight: number;
    }>;
    recommendations: Array<{
      id: string;
      rec_type: string;
      title: string;
      message: string;
      data: Record<string, unknown>;
      created_at: string;
    }>;
    recent_notifications: IntelligenceNotification[];
    blueprint: Record<string, unknown> | null;
  };
  filename: string;
  pdf_base64: string;
}
