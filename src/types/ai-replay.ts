export type InsightSeverity = "info" | "warning" | "critical";

export interface Insight {
  id: string;
  type: string;
  severity: InsightSeverity;
  title: string;
  message: string;
  data: Record<string, unknown>;
}

export interface AIInsightsResponse {
  insights: Insight[];
}

export interface ReplaySeriesPoint {
  day: number;
  projected_balance: number;
}

export interface ReplayResult {
  starting_balance: number;
  baseline_daily_net: number;
  horizon_days: number;
  ending_balance: number;
  min_balance: number;
  min_balance_day: number;
  goes_negative_on_day: number | null;
  series: ReplaySeriesPoint[];
  scenarios_applied: Record<string, unknown>[];
}
