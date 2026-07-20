"use client";

import { useCallback, useEffect, useState } from "react";
import { integrationService } from "@/core/services/integration.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDateTime } from "@/core/utils/format";
import type {
  BusinessSystemType,
  IntegrationCatalogEntry,
  IntegrationsList,
} from "@/types/platform";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

const SYSTEM_TYPE_LABELS: Record<BusinessSystemType, string> = {
  payroll: "Payroll",
  accounting: "Accounting",
  inventory: "Inventory",
  crm: "CRM",
  erp: "ERP",
  warehouse: "Warehouse",
  pos: "POS",
  hr: "HR",
  custom: "Custom Systems",
};

const HEALTH_COLOR: Record<string, string> = {
  healthy: "text-signal-green",
  unhealthy: "text-signal-red",
  unknown: "text-graphite-600",
};

export default function BusinessSystemsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<IntegrationsList | null>(null);

  const [activeType, setActiveType] = useState<BusinessSystemType | "all">("all");
  const [selected, setSelected] = useState<IntegrationCatalogEntry | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setState("loading");
    integrationService
      .list<IntegrationsList>()
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

  function selectSystem(entry: IntegrationCatalogEntry) {
    setSelected(entry);
    setCredentials({});
    setTestResult(null);
  }

  async function handleTest() {
    if (!selected) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await integrationService.test({ provider: selected.provider, credentials });
      setTestResult(
        res.ok
          ? res.message ?? "Looks good."
          : `${res.message ?? "Missing fields"}${res.missing_fields ? `: ${res.missing_fields.join(", ")}` : ""}`,
      );
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  async function handleConnect() {
    if (!selected) return;
    setConnecting(true);
    setErrorMessage(null);
    try {
      await integrationService.connect({ provider: selected.provider, credentials });
      setSelected(null);
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not connect system");
    } finally {
      setConnecting(false);
    }
  }

  async function handleTestExisting(id: string) {
    setActingId(id);
    try {
      const res = await integrationService.test({ id });
      setErrorMessage(
        res.ok
          ? null
          : `${res.message ?? "Test failed"}${res.missing_fields ? `: ${res.missing_fields.join(", ")}` : ""}`,
      );
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Test failed");
    } finally {
      setActingId(null);
    }
  }

  async function handleDisconnect(id: string) {
    setActingId(id);
    try {
      await integrationService.disconnect(id);
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not disconnect system");
    } finally {
      setActingId(null);
    }
  }

  const types: (BusinessSystemType | "all")[] = [
    "all",
    "payroll",
    "accounting",
    "inventory",
    "crm",
    "erp",
    "warehouse",
    "pos",
    "hr",
    "custom",
  ];

  const visibleCatalog = (
    data?.catalog.filter((c) => activeType === "all" || c.system_type === activeType) ?? []
  ).sort((a, b) => Number(b.recommended) - Number(a.recommended));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Business Systems</h1>
        <p className="text-sm text-graphite-600">
          Connect the payroll, accounting, inventory, CRM, ERP, warehouse, POS, and HR software
          your business already runs on. Systems marked &quot;recommended&quot; match the
          business type you set in your Company Blueprint.
        </p>
      </div>

      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading business systems…</p>
        </Card>
      )}

      {state === "not-implemented" && (
        <Card>
          <p className="text-sm text-graphite-600">
            This capability isn&apos;t implemented in the Kernel yet - the pipeline is wired end
            to end and returns an honest &quot;not built yet&quot;, not an error.
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
        <>
          {errorMessage && (
            <p role="alert" className="text-sm text-signal-red">
              {errorMessage}
            </p>
          )}

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">Connected</p>
            {data.connected.length === 0 ? (
              <Card>
                <p className="text-sm text-graphite-600">Nothing connected yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {data.connected.map((c) => (
                  <Card key={c.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-display text-lg text-paper">{c.display_name}</p>
                        <p className="mt-1 font-mono text-xs text-signal-green">{c.status}</p>
                      </div>
                      <span className="rounded bg-graphite-800 px-2 py-0.5 font-mono text-xs text-graphite-600">
                        {SYSTEM_TYPE_LABELS[c.system_type]}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-0.5 text-xs text-graphite-600">
                      <p>Authentication: {c.authentication}</p>
                      <p>
                        Health:{" "}
                        <span className={HEALTH_COLOR[c.health]}>{c.health}</span>
                      </p>
                      <p>Last sync: {c.last_synced_at ? formatDateTime(c.last_synced_at) : "never"}</p>
                      <p className="font-mono">Connection ID: {c.id}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleTestExisting(c.id)}
                        disabled={actingId === c.id}
                      >
                        {actingId === c.id ? "Testing…" : "Test connection"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDisconnect(c.id)}
                        disabled={actingId === c.id}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Connect a business system
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveType(t)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    activeType === t
                      ? "border-signal-amber text-paper"
                      : "border-graphite-600 text-graphite-600 hover:text-paper"
                  }`}
                >
                  {t === "all" ? "All" : SYSTEM_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleCatalog.map((p) => (
                <Card
                  key={p.provider}
                  className={`cursor-pointer transition-colors ${
                    selected?.provider === p.provider ? "border-signal-amber" : ""
                  } ${p.connected ? "opacity-50" : ""}`}
                  onClick={() => !p.connected && selectSystem(p)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-lg text-paper">{p.display_name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-graphite-600">
                          {SYSTEM_TYPE_LABELS[p.system_type]}
                        </p>
                        {p.recommended && !p.connected && (
                          <span className="rounded bg-signal-amber/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-signal-amber">
                            recommended
                          </span>
                        )}
                      </div>
                    </div>
                    {p.connected && (
                      <span className="font-mono text-xs text-signal-green">connected</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {selected && (
              <Card className="mt-4">
                <p className="mb-3 text-sm text-paper">
                  Connect <span className="font-display">{selected.display_name}</span>
                </p>

                <div className="flex flex-col gap-3">
                  {selected.credential_fields.map((field) => (
                    <div key={field}>
                      <label className="mb-1 block text-xs text-graphite-600">{field}</label>
                      <Input
                        type="password"
                        value={credentials[field] ?? ""}
                        onChange={(e) =>
                          setCredentials((prev) => ({ ...prev, [field]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>

                {testResult && <p className="mt-3 text-xs text-graphite-600">{testResult}</p>}

                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" onClick={handleTest} disabled={testing}>
                    {testing ? "Testing…" : "Test connection"}
                  </Button>
                  <Button onClick={handleConnect} disabled={connecting}>
                    {connecting ? "Connecting…" : "Connect"}
                  </Button>
                  <Button variant="ghost" onClick={() => setSelected(null)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
