export interface FinancialSummary {
  balance: number;
  currency: string;
  inflow_30d: number;
  outflow_30d: number;
  net_30d: number;
  anomalies_30d: number;
  transactions_30d: number;
}

export interface HealthScore {
  score: number;
  label: "strong" | "watch" | "at risk";
  signals: string[];
}

export interface LedgerTransaction {
  id: string;
  account_id: string;
  direction: "inflow" | "outflow";
  amount: number;
  currency: string;
  category: string;
  counterparty: string | null;
  description: string;
  source: string;
  is_anomaly: boolean;
  occurred_at: string;
}

export interface ProviderConnection {
  provider: string;
  display_name: string;
  status: string;
  last_synced_at: string | null;
}

export interface DashboardOverview {
  company: { id: string; name: string | null; country: string | null };
  summary: FinancialSummary;
  health: HealthScore;
  recent_transactions: LedgerTransaction[];
  connections: ProviderConnection[];
  blueprint: {
    business_type: string;
    priorities: string[];
    large_transaction_threshold: number | null;
    notify_on_large_transaction: boolean;
    weekly_digest: boolean;
    version: number;
    published_at: string;
  } | null;
}

export interface AvailableProvider {
  provider: string;
  display_name: string;
}

export interface ProvidersList {
  connected: (ProviderConnection & { connected_at: string })[];
  available: AvailableProvider[];
}
