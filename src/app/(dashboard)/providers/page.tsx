"use client";

import { useCallback, useEffect, useState } from "react";
import { providerService } from "@/core/services/provider.service";
import { graphService } from "@/core/services/graph.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateTime } from "@/core/utils/format";
import type { CatalogProvider, ProviderCategory, ProvidersList } from "@/types/platform";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  bank: "Commercial Banks",
  mobile_money: "Mobile Money",
  payment_gateway: "Payment Gateways",
  crypto: "Crypto Providers",
  custom: "Custom Financial Providers",
};

export default function ProvidersPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<ProvidersList | null>(null);

  const [activeCategory, setActiveCategory] = useState<ProviderCategory | "all">("all");
  const [selected, setSelected] = useState<CatalogProvider | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [webhookUrl, setWebhookUrl] = useState("");
  const [signingSecret, setSigningSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [actingId, setActingId] = useState<string | null>(null);

  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const load = useCallback(() => {
    setState("loading");
    providerService
      .list<ProvidersList>()
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

  function selectProvider(entry: CatalogProvider) {
    setSelected(entry);
    setCredentials({});
    setWebhookUrl("");
    setSigningSecret("");
    setRefreshToken("");
    setTestResult(null);
  }

  async function handleTest() {
    if (!selected) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await providerService.test({ provider: selected.provider, credentials });
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
      await providerService.connect({
        provider: selected.provider,
        credentials,
        webhook_url: webhookUrl || undefined,
        signing_secret: signingSecret || undefined,
        refresh_token: refreshToken || undefined,
      });
      setSelected(null);
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not connect provider");
    } finally {
      setConnecting(false);
    }
  }

  async function handleTestExisting(id: string) {
    setActingId(id);
    try {
      const res = await providerService.test({ id });
      setErrorMessage(
        res.ok
          ? null
          : `${res.message ?? "Test failed"}${res.missing_fields ? `: ${res.missing_fields.join(", ")}` : ""}`,
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Test failed");
    } finally {
      setActingId(null);
    }
  }

  async function handleDisconnect(id: string) {
    setActingId(id);
    try {
      await providerService.disconnect(id);
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not disconnect provider");
    } finally {
      setActingId(null);
    }
  }

  async function handleImportCsv() {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await graphService.importCsv<{
        imported: number;
        skipped: number;
        errors: string[];
      }>(csvText);
      setImportResult(res);
      setCsvText("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const categories: (ProviderCategory | "all")[] = [
    "all",
    "bank",
    "mobile_money",
    "payment_gateway",
    "crypto",
    "custom",
  ];

  const visibleCatalog = (
    data?.catalog.filter((c) => activeCategory === "all" || c.category === activeCategory) ?? []
  ).sort((a, b) => Number(b.recommended) - Number(a.recommended));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Financial Connections</h1>
        <p className="text-sm text-graphite-600">
          Connect the banks, mobile money, payment gateways, and crypto providers your business
          uses. Orbit encrypts your credentials before they ever touch storage. Providers marked
          &quot;recommended&quot; match the business type you set in your Company Blueprint.
        </p>
      </div>

      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading providers…</p>
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
                        {CATEGORY_LABELS[c.category]}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-0.5 text-xs text-graphite-600">
                      {c.country && <p>Country: {c.country}</p>}
                      <p>Auth: {c.auth_method}</p>
                      <p>Connected {formatDateTime(c.connected_at)}</p>
                      <p>Last synced {c.last_synced_at ? formatDateTime(c.last_synced_at) : "never"}</p>
                      {c.webhook_url && <p className="truncate">Webhook: {c.webhook_url}</p>}
                      <p>
                        {c.has_credentials && "Credentials stored (encrypted). "}
                        {c.has_signing_secret && "Signing secret set. "}
                        {c.has_refresh_token && "Refresh token set."}
                      </p>
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
              Connect a provider
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    activeCategory === cat
                      ? "border-signal-amber text-paper"
                      : "border-graphite-600 text-graphite-600 hover:text-paper"
                  }`}
                >
                  {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
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
                  onClick={() => !p.connected && selectProvider(p)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-lg text-paper">{p.display_name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-graphite-600">
                          {CATEGORY_LABELS[p.category]} · {p.countries.join(", ")}
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

                  <div>
                    <label className="mb-1 block text-xs text-graphite-600">
                      Webhook URL (optional)
                    </label>
                    <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-graphite-600">
                      Signing secret (optional)
                    </label>
                    <Input
                      type="password"
                      value={signingSecret}
                      onChange={(e) => setSigningSecret(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-graphite-600">
                      Refresh token (optional)
                    </label>
                    <Input
                      type="password"
                      value={refreshToken}
                      onChange={(e) => setRefreshToken(e.target.value)}
                    />
                  </div>
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

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Import a bank statement
            </p>
            <Card>
              <p className="mb-3 text-xs text-graphite-600">
                Paste a CSV export from your bank or mobile money provider - columns{" "}
                <span className="font-mono">date, description, amount</span> (negative =
                outflow), optionally with a <span className="font-mono">direction</span> column.
                This works with real statements today, no integration required.
              </p>
              <Textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={"date,description,amount\n2026-07-01,Customer Payment,15000\n2026-07-02,Supplier Invoice,-8000"}
              />
              <Button className="mt-3" onClick={handleImportCsv} disabled={importing}>
                {importing ? "Importing…" : "Import"}
              </Button>
              {importResult && (
                <div className="mt-3 rounded bg-graphite-900 p-3 text-xs">
                  <p className="text-signal-green">
                    Imported {importResult.imported} transaction(s)
                    {importResult.skipped > 0 && `, skipped ${importResult.skipped}`}.
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-0.5 text-graphite-600">
                      {importResult.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
