"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService } from "@/core/services/dashboard.service";
import { providerService } from "@/core/services/provider.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HealthGauge } from "@/components/dashboard/HealthGauge";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { formatMoney } from "@/core/utils/format";
import type { DashboardOverview } from "@/types/dashboard";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

export default function OverviewPage() {
  const { session } = useAuth();
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [connecting, setConnecting] = useState(false);

  const load = useCallback(() => {
    setState("loading");
    dashboardService
      .overview<DashboardOverview>()
      .then((data) => {
        setOverview(data);
        setState("ready");
      })
      .catch((err) => {
        if (err instanceof GatewayError && err.status === 501) {
          setState("not-implemented");
        } else {
          setState("error");
          setErrorMessage(err instanceof Error ? err.message : "Unknown error");
        }
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConnect() {
    setConnecting(true);
    try {
      await providerService.connect({ provider: "mock_mobile_money", credentials: {} });
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not connect provider");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Overview</h1>
        <p className="text-sm text-graphite-600">
          Signed in as <span className="font-mono">{session?.email}</span> ·{" "}
          {session?.companyName} · role <span className="font-mono">{session?.role}</span>
        </p>
      </div>

      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading your financial timeline…</p>
        </Card>
      )}

      {state === "not-implemented" && (
        <Card>
          <p className="text-sm text-graphite-600">
            The dashboard workflow isn&apos;t implemented in the Kernel yet - the full pipeline
            (page → dashboard.service → gateway.ts → Gateway → Kernel) is wired and working end
            to end; this is genuinely the honest &quot;not built yet&quot; response, not an error.
          </p>
        </Card>
      )}

      {state === "error" && (
        <Card>
          <p role="alert" className="text-sm text-signal-red">
            {errorMessage}
          </p>
        </Card>
      )}

      {state === "ready" && overview && (
        <>
          {overview.blueprint && (
            <Card className="border-graphite-700/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-graphite-800 px-2 py-0.5 font-mono text-xs text-graphite-600">
                    {overview.blueprint.business_type}
                  </span>
                  {overview.blueprint.priorities.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-signal-amber/40 px-2 py-0.5 text-xs text-signal-amber"
                    >
                      {p.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
                {overview.blueprint.notify_on_large_transaction &&
                  overview.blueprint.large_transaction_threshold != null && (
                    <p className="text-xs text-graphite-600">
                      Alerting on transactions ≥{" "}
                      {formatMoney(
                        overview.blueprint.large_transaction_threshold,
                        overview.summary.currency,
                      )}
                    </p>
                  )}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-wide text-graphite-600">Cash position</p>
              <p className="mt-2 font-display text-3xl text-paper">
                {formatMoney(overview.summary.balance, overview.summary.currency)}
              </p>
              <p className="mt-1 text-xs text-graphite-600">
                {overview.summary.transactions_30d} transactions in the last 30 days
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-graphite-600">30-day inflow</p>
              <p className="mt-2 font-display text-2xl text-signal-green">
                +{formatMoney(overview.summary.inflow_30d, overview.summary.currency)}
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-graphite-800">
                <div
                  className="h-full rounded-full bg-signal-green"
                  style={{
                    width: `${Math.min(
                      100,
                      (overview.summary.inflow_30d /
                        Math.max(1, overview.summary.inflow_30d + overview.summary.outflow_30d)) *
                        100,
                    )}%`,
                  }}
                />
              </div>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-graphite-600">30-day outflow</p>
              <p className="mt-2 font-display text-2xl text-signal-red">
                -{formatMoney(overview.summary.outflow_30d, overview.summary.currency)}
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-graphite-800">
                <div
                  className="h-full rounded-full bg-signal-red"
                  style={{
                    width: `${Math.min(
                      100,
                      (overview.summary.outflow_30d /
                        Math.max(1, overview.summary.inflow_30d + overview.summary.outflow_30d)) *
                        100,
                    )}%`,
                  }}
                />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <p className="mb-4 text-xs uppercase tracking-wide text-graphite-600">
                Business health
              </p>
              <HealthGauge health={overview.health} />
            </Card>

            <Card className="lg:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-graphite-600">
                  Recent activity
                </p>
              </div>
              <TransactionList transactions={overview.recent_transactions} />
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-graphite-600">
                  Connected providers
                </p>
                {overview.connections.length === 0 ? (
                  <p className="mt-2 text-sm text-graphite-600">
                    Nothing connected yet. Connect a provider to pull real activity into your
                    financial timeline.
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1">
                    {overview.connections.map((c) => (
                      <li key={c.provider} className="text-sm text-paper">
                        {c.display_name}{" "}
                        <span className="font-mono text-xs text-graphite-600">({c.status})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {overview.connections.length === 0 && (
                <Button onClick={handleConnect} disabled={connecting}>
                  {connecting ? "Connecting…" : "Connect Mobile Money (Demo)"}
                </Button>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
