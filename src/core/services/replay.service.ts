import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";

/**
 * Replay Service
 *
 * Thin translation layer over the Gateway's /replay endpoint (the
 * Digital Financial Twin's non-destructive what-if simulation).
 */
export const replayService = {
  async defaultTrajectory<T = unknown>(): Promise<T> {
    return gateway.get<T>(endpoints.replay);
  },
  async simulate<T = unknown>(
    scenarios: {
      label: string;
      kind: "one_time" | "recurring";
      amount: number;
      day_offset?: number;
      frequency_days?: number;
    }[],
    horizonDays: number = 90,
  ): Promise<T> {
    return gateway.post<T>(endpoints.replay, { scenarios, horizon_days: horizonDays });
  },
};
