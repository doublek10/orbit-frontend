"use client";

import { useCallback, useEffect, useState } from "react";
import { aiService } from "@/core/services/ai.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import type { AIInsightsResponse, Insight, InsightSeverity } from "@/types/ai-replay";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

const SEVERITY_STYLE: Record<InsightSeverity, string> = {
  info: "border-l-graphite-600",
  warning: "border-l-signal-amber",
  critical: "border-l-signal-red",
};

const SEVERITY_BADGE: Record<InsightSeverity, string> = {
  info: "bg-graphite-800 text-graphite-600",
  warning: "bg-signal-amber/15 text-signal-amber",
  critical: "bg-signal-red/15 text-signal-red",
};

export default function InsightsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  const load = useCallback(() => {
    setState("loading");
    aiService
      .insights<AIInsightsResponse>()
      .then((res) => {
        setInsights(res.insights);
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Insights</h1>
        <p className="text-sm text-graphite-600">
          Generated from your Financial Graph - transparent, arithmetic-based analysis, not a
          black box. Each one shows exactly what it's measuring.
        </p>
      </div>

      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Analyzing your financial timeline…</p>
        </Card>
      )}

      {state === "not-implemented" && (
        <Card>
          <p className="text-sm text-graphite-600">
            This capability isn&apos;t implemented in the Kernel yet.
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

      {state === "ready" && (
        <div className="flex flex-col gap-3">
          {insights.length === 0 ? (
            <Card>
              <p className="text-sm text-graphite-600">
                Not enough activity yet to generate insights - connect a provider or record some
                transactions first.
              </p>
            </Card>
          ) : (
            insights.map((insight) => (
              <Card
                key={insight.id}
                className={`border-l-4 ${SEVERITY_STYLE[insight.severity]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-display text-base text-paper">{insight.title}</p>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${SEVERITY_BADGE[insight.severity]}`}
                  >
                    {insight.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-graphite-600">{insight.message}</p>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
