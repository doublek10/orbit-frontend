"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/shared/AuthGate";
import { Card } from "@/components/ui/Card";
import { enterpriseService } from "@/core/services/enterprise.service";
import { GatewayError } from "@/core/gateway/response";
import { formatDateTime } from "@/core/utils/format";
import type { EnterpriseOverview } from "@/types/marketplace-enterprise";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

export default function EnterprisePage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<EnterpriseOverview | null>(null);

  const load = useCallback(() => {
    setState("loading");
    enterpriseService
      .overview<EnterpriseOverview>()
      .then((res) => {
        setData(res);
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
    <AuthGate title="Enterprise">
      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading…</p>
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

      {state === "ready" && data && (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-graphite-600">
            Audit and compliance visibility for this company. Multi-organization management and
            licensing tiers aren&apos;t built yet - this is the real audit trail every workflow
            already writes to, made visible.
          </p>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              ["Team members", data.summary.members],
              ["Active API keys", data.summary.active_keys],
              ["Automations", data.summary.automations],
              ["Installed apps", data.summary.installed_apps],
              ["Connections", data.summary.connections],
            ].map(([label, value]) => (
              <Card key={label as string}>
                <p className="font-display text-2xl text-paper">{value as number}</p>
                <p className="mt-1 text-xs text-graphite-600">{label}</p>
              </Card>
            ))}
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">Audit trail</p>
            <Card>
              {data.audit_trail.length === 0 ? (
                <p className="text-sm text-graphite-600">No activity recorded yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-graphite-700">
                  {data.audit_trail.map((entry, i) => (
                    <li key={i} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-mono text-sm text-paper">{entry.action}</p>
                        <p className="text-xs text-graphite-600">{entry.actor_email}</p>
                      </div>
                      <p className="font-mono text-xs text-graphite-600">
                        {formatDateTime(entry.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </AuthGate>
  );
}
