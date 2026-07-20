"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/shared/AuthGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { marketplaceService } from "@/core/services/marketplace.service";
import { GatewayError } from "@/core/gateway/response";
import type { MarketplaceApp, MarketplaceList } from "@/types/marketplace-enterprise";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

const CATEGORY_COLOR: Record<string, string> = {
  intelligence: "text-signal-amber",
  automation: "text-signal-green",
  reporting: "text-graphite-600",
  compliance: "text-signal-red",
};

export default function MarketplacePage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(() => {
    setState("loading");
    marketplaceService
      .list<MarketplaceList>()
      .then((res) => {
        setApps(res.apps.slice().sort((a, b) => Number(b.recommended) - Number(a.recommended)));
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

  async function handleToggle(app: MarketplaceApp) {
    setBusyKey(app.app_key);
    try {
      await marketplaceService.toggle(app.app_key, app.installed ? "uninstall" : "install");
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not update app");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <AuthGate title="Marketplace">
      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading marketplace…</p>
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
        <div className="flex flex-col gap-4">
          <p className="text-sm text-graphite-600">
            First-party modules you can turn on for this company. Third-party developer
            submissions aren&apos;t open yet - see the Developer page for the API this will run
            on.{" "}
            <span className="text-graphite-600">
              Apps marked &quot;recommended for you&quot; match the priorities you set in your
              Company Blueprint.
            </span>
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {apps.map((app) => (
              <Card key={app.app_key}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg text-paper">{app.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p
                        className={`font-mono text-[10px] uppercase tracking-wide ${
                          CATEGORY_COLOR[app.category] ?? "text-graphite-600"
                        }`}
                      >
                        {app.category}
                      </p>
                      {app.recommended && (
                        <span className="rounded bg-signal-amber/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-signal-amber">
                          recommended for you
                        </span>
                      )}
                    </div>
                  </div>
                  {app.installed && (
                    <span className="rounded bg-signal-green/15 px-2 py-1 text-[10px] uppercase tracking-wide text-signal-green">
                      installed
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-graphite-600">{app.description}</p>
                <Button
                  variant={app.installed ? "ghost" : "primary"}
                  className="mt-4"
                  onClick={() => handleToggle(app)}
                  disabled={busyKey === app.app_key}
                >
                  {busyKey === app.app_key
                    ? "Working…"
                    : app.installed
                      ? "Uninstall"
                      : "Install"}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AuthGate>
  );
}
