"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/shared/AuthGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { developerService } from "@/core/services/developer.service";
import { mappingService } from "@/core/services/mapping.service";
import { GatewayError } from "@/core/gateway/response";
import { formatDateTime } from "@/core/utils/format";
import type {
  ApiKey,
  ApiGenerateResult,
  CompanyEndpointInfo,
  CreatedApiKey,
  DeveloperKeysList,
  SdkLanguage,
  TestEndpointResult,
} from "@/types/platform-admin";
import type { DataMapping } from "@/types/platform";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

const SDK_LANGUAGES: SdkLanguage[] = ["typescript", "javascript", "php", "python", "java"];

export default function DeveloperPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [busyKeyId, setBusyKeyId] = useState<string | null>(null);

  const [endpoint, setEndpoint] = useState<CompanyEndpointInfo | null>(null);
  const [revealedWebhookSecret, setRevealedWebhookSecret] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [rotating, setRotating] = useState(false);

  const [testPayloadText, setTestPayloadText] = useState('{\n  "amount": 15000,\n  "direction": "in"\n}');
  const [mappings, setMappings] = useState<DataMapping[]>([]);
  const [selectedMappingId, setSelectedMappingId] = useState("");
  const [testResult, setTestResult] = useState<TestEndpointResult | null>(null);
  const [testing, setTesting] = useState(false);

  const [sdkLanguage, setSdkLanguage] = useState<SdkLanguage>("typescript");
  const [sdkCode, setSdkCode] = useState<string | null>(null);
  const [sdkLoading, setSdkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    setState("loading");
    developerService
      .list<DeveloperKeysList>()
      .then((res) => {
        setKeys(res.api_keys);
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
    mappingService
      .list<{ mappings: DataMapping[] }>()
      .then((res) => setMappings(res.mappings))
      .catch(() => {
        // Optional enrichment for the Test Console - fine if unavailable.
      });
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await developerService.createKey<CreatedApiKey>(name.trim());
      setRevealedSecret(res.api_key.secret);
      setName("");
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not create key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    setBusyKeyId(keyId);
    try {
      await developerService.revokeKey(keyId);
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not revoke key");
    } finally {
      setBusyKeyId(null);
    }
  }

  async function handleGenerateEndpoint() {
    setGenerating(true);
    setErrorMessage(null);
    try {
      const res = await developerService.generateApiCredentials<ApiGenerateResult>();
      setEndpoint(res.endpoint);
      if (res.webhook_secret) setRevealedWebhookSecret(res.webhook_secret);
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not generate API credentials");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRotateSecret() {
    setRotating(true);
    setErrorMessage(null);
    try {
      const res = await developerService.rotateWebhookSecret();
      setEndpoint(res.endpoint);
      setRevealedWebhookSecret(res.webhook_secret);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not rotate secret");
    } finally {
      setRotating(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const parsed = JSON.parse(testPayloadText);
      const res = await developerService.testEndpoint(parsed, selectedMappingId || undefined);
      setTestResult(res);
    } catch (err) {
      setErrorMessage(
        err instanceof SyntaxError
          ? "That's not valid JSON."
          : err instanceof Error
            ? err.message
            : "Test failed",
      );
    } finally {
      setTesting(false);
    }
  }

  async function handleLoadSdk(language: SdkLanguage) {
    setSdkLanguage(language);
    setSdkLoading(true);
    setCopied(false);
    try {
      const res = await developerService.generateSdk(language);
      setSdkCode(res.code);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not generate SDK code");
    } finally {
      setSdkLoading(false);
    }
  }

  function handleCopy() {
    if (!sdkCode) return;
    navigator.clipboard.writeText(sdkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!sdkCode) return;
    const extensions: Record<SdkLanguage, string> = {
      typescript: "ts",
      javascript: "js",
      php: "php",
      python: "py",
      java: "java",
    };
    const blob = new Blob([sdkCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orbit-client.${extensions[sdkLanguage]}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AuthGate title="Developer">
      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading API keys…</p>
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

      {(state === "ready" || revealedSecret) && (
        <div className="flex flex-col gap-6">
          {errorMessage && (
            <p role="alert" className="text-sm text-signal-red">
              {errorMessage}
            </p>
          )}

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Orbit API Generator
            </p>
            <Card>
              {!endpoint ? (
                <>
                  <p className="text-sm text-graphite-600">
                    Generate your Company Endpoint - a unique URL, an API key, and a webhook
                    signing secret Orbit uses to verify anything sent in your company&apos;s name.
                  </p>
                  <Button className="mt-3" onClick={handleGenerateEndpoint} disabled={generating}>
                    {generating ? "Generating…" : "Generate Orbit endpoint"}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2 text-sm">
                  <p className="text-paper">
                    Company Endpoint:{" "}
                    <span className="break-all font-mono text-xs text-signal-amber">
                      {endpoint.endpoint_url}
                    </span>
                  </p>
                  <p className="text-xs text-graphite-600">
                    Rate limit: {endpoint.rate_limit_per_minute}/min · created{" "}
                    {formatDateTime(endpoint.created_at)}
                    {endpoint.rotated_at && ` · secret rotated ${formatDateTime(endpoint.rotated_at)}`}
                  </p>
                  <Button
                    variant="ghost"
                    className="w-fit"
                    onClick={handleRotateSecret}
                    disabled={rotating}
                  >
                    {rotating ? "Rotating…" : "Rotate webhook secret"}
                  </Button>
                </div>
              )}

              {revealedWebhookSecret && (
                <div className="mt-3 rounded border border-signal-amber/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-signal-amber">
                    Webhook secret - copy this now, it won&apos;t be shown again
                  </p>
                  <p className="mt-2 break-all rounded bg-graphite-900 p-3 font-mono text-sm text-paper">
                    {revealedWebhookSecret}
                  </p>
                  <Button className="mt-3" onClick={() => setRevealedWebhookSecret(null)}>
                    Done
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {endpoint && (
            <div>
              <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
                Test Console
              </p>
              <Card>
                <p className="mb-2 text-xs text-graphite-600">
                  Signs a sample payload with your real webhook secret and verifies it - the same
                  mechanism a live request would use.
                </p>
                <Textarea
                  rows={5}
                  className="font-mono"
                  value={testPayloadText}
                  onChange={(e) => setTestPayloadText(e.target.value)}
                />
                {mappings.length > 0 && (
                  <div className="mt-2">
                    <label className="mb-1 block text-xs text-graphite-600">
                      Preview through a mapping (optional)
                    </label>
                    <select
                      value={selectedMappingId}
                      onChange={(e) => setSelectedMappingId(e.target.value)}
                      className="rounded border border-graphite-700 bg-graphite-900 px-2 py-1 text-xs text-paper"
                    >
                      <option value="">None</option>
                      {mappings.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Button className="mt-3" onClick={handleTest} disabled={testing}>
                  {testing ? "Testing…" : "Send test event"}
                </Button>

                {testResult && (
                  <div className="mt-3 rounded bg-graphite-900 p-3 text-xs">
                    <p className={testResult.signature_verified ? "text-signal-green" : "text-signal-red"}>
                      Signature {testResult.signature_verified ? "verified" : "failed"}
                    </p>
                    <p className="mt-1 break-all text-graphite-600">
                      X-Orbit-Signature: {testResult.signature}
                    </p>
                    <p className="break-all text-graphite-600">
                      X-Orbit-Request-Id: {testResult.request_id}
                    </p>
                    {testResult.mapping_preview && (
                      <>
                        <p className="mt-2 text-graphite-600">Mapping preview:</p>
                        <pre className="whitespace-pre-wrap font-mono text-paper">
                          {JSON.stringify(testResult.mapping_preview.canonical, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">SDK Generator</p>
            <Card>
              <div className="mb-3 flex flex-wrap gap-2">
                {SDK_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLoadSdk(lang)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      sdkLanguage === lang && sdkCode
                        ? "border-signal-amber text-paper"
                        : "border-graphite-600 text-graphite-600 hover:text-paper"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {sdkLoading && <p className="text-sm text-graphite-600">Generating…</p>}

              {sdkCode && !sdkLoading && (
                <>
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded bg-graphite-900 p-3 font-mono text-xs text-paper">
                    {sdkCode}
                  </pre>
                  <div className="mt-3 flex gap-2">
                    <Button variant="ghost" onClick={handleCopy}>
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="ghost" onClick={handleDownload}>
                      Download
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>

          {revealedSecret && (
            <Card className="border border-signal-amber/40">
              <p className="text-xs uppercase tracking-wide text-signal-amber">
                Copy this now - it won&apos;t be shown again
              </p>
              <p className="mt-2 break-all rounded bg-graphite-900 p-3 font-mono text-sm text-paper">
                {revealedSecret}
              </p>
              <Button className="mt-3" onClick={() => setRevealedSecret(null)}>
                Done
              </Button>
            </Card>
          )}

          <Card>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Create a new API key
            </p>
            <form onSubmit={handleCreate} className="flex items-end gap-3">
              <label className="flex flex-1 flex-col gap-1 text-xs text-graphite-600">
                Name
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production integration"
                  required
                />
              </label>
              <Button type="submit" disabled={creating}>
                {creating ? "Generating…" : "Generate key"}
              </Button>
            </form>
          </Card>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Existing keys
            </p>
            {keys.length === 0 ? (
              <Card>
                <p className="text-sm text-graphite-600">No API keys yet.</p>
              </Card>
            ) : (
              <Card>
                <ul className="flex flex-col divide-y divide-graphite-700">
                  {keys.map((k) => (
                    <li key={k.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm text-paper">{k.name}</p>
                        <p className="font-mono text-xs text-graphite-600">
                          {k.key_prefix}… · created {formatDateTime(k.created_at)}
                          {k.last_used_at && ` · last used ${formatDateTime(k.last_used_at)}`}
                        </p>
                      </div>
                      {k.revoked ? (
                        <span className="rounded bg-signal-red/15 px-2 py-1 font-mono text-xs text-signal-red">
                          revoked
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => handleRevoke(k.id)}
                          disabled={busyKeyId === k.id}
                        >
                          {busyKeyId === k.id ? "Revoking…" : "Revoke"}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}
    </AuthGate>
  );
}
