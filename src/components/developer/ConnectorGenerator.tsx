"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { developerService } from "@/core/services/developer.service";
import { GatewayError } from "@/core/gateway/response";
import type {
  ConnectorConnectionInput,
  ConnectorDatabase,
  ConnectorLanguage,
  ConnectorPreferences,
  ConnectorTableMappingInput,
  ConnectorTestResult,
} from "@/types/platform-admin";
import {
  CONNECTOR_DATABASES,
  CONNECTOR_DATABASE_LABELS,
  CONNECTOR_LANGUAGES,
  CONNECTOR_LANGUAGE_EXTENSIONS,
  CONNECTOR_LANGUAGE_LABELS,
} from "@/types/platform-admin";

const DEFAULT_TABLES: ConnectorTableMappingInput[] = [
  { entity: "employees", table: "employees", id_column: "id" },
  { entity: "invoices", table: "invoices", id_column: "id" },
  { entity: "inventory", table: "inventory", id_column: "id" },
  { entity: "payments", table: "payments", id_column: "id" },
];

const DEFAULT_CONNECTION: ConnectorConnectionInput = {
  host: "",
  port: "",
  database: "",
  username: "",
  password: "",
  ssl: false,
  connector_url: "",
  connector_token: "",
};

type Step = "language" | "database" | "configure" | "code";

/**
 * Orbit Connector Generator
 *
 * Step 1: language. Step 2: database engine. Step 3: an editable
 * connection form + table map (which of the user's own tables map to
 * which Orbit entity - employees, invoices, inventory, payments,
 * anything else). Step 4: the generated code, still editable, with a
 * filename field defaulting to orbit-connector.<ext>, download/copy,
 * and a Test Connection button that runs a live read-only preview via
 * the Kernel - nothing from that preview is ever saved.
 *
 * Orbit remembers three things across visits: language, database
 * engine, and the Connector URL (never host/port/username, and never
 * the password - same rule the generator itself follows). Loaded once
 * on mount and re-saved whenever the code is generated or a test
 * connection succeeds. If Test Connection is clicked with nothing to
 * test against, a prompt asks for the Connector URL so it can be
 * saved and used right away.
 */
export function ConnectorGenerator() {
  const [step, setStep] = useState<Step>("language");
  const [language, setLanguage] = useState<ConnectorLanguage | null>(null);
  const [database, setDatabase] = useState<ConnectorDatabase | null>(null);
  const [connection, setConnection] = useState<ConnectorConnectionInput>(DEFAULT_CONNECTION);
  const [tables, setTables] = useState<ConnectorTableMappingInput[]>(DEFAULT_TABLES);
  const [filename, setFilename] = useState("");

  const [code, setCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [testResult, setTestResult] = useState<ConnectorTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const [loadedPreferences, setLoadedPreferences] = useState<ConnectorPreferences | null>(null);
  const [restoredFromMemory, setRestoredFromMemory] = useState(false);
  const [urlPromptOpen, setUrlPromptOpen] = useState(false);
  const [urlPromptValue, setUrlPromptValue] = useState("");

  // Load what Orbit remembers from the last visit - language, database
  // engine, and Connector URL - and prefill the wizard with it so the
  // company doesn't have to redo the whole flow every time.
  useEffect(() => {
    developerService
      .getConnectorPreferences<{ preferences: ConnectorPreferences | null }>()
      .then((res) => {
        const prefs = res.preferences;
        if (!prefs) return;
        setLoadedPreferences(prefs);
        setLanguage(prefs.language);
        setDatabase(prefs.database);
        if (prefs.connector_url) {
          setConnection((c) => ({ ...c, connector_url: prefs.connector_url ?? "" }));
        }
        setStep("configure");
        setRestoredFromMemory(true);
      })
      .catch(() => {
        // No saved preferences yet, or the read failed - just start
        // the wizard fresh, same as a first-time visit.
      });
  }, []);

  function rememberPreferences(lang: ConnectorLanguage, db: ConnectorDatabase, connectorUrl: string) {
    developerService
      .saveConnectorPreferences({ language: lang, database: db, connector_url: connectorUrl || null })
      .then((res) => setLoadedPreferences(res.preferences))
      .catch(() => {
        // Best-effort - the wizard still works fine this session even
        // if remembering it for next time didn't go through.
      });
  }

  function updateTable(index: number, patch: Partial<ConnectorTableMappingInput>) {
    setTables((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTable() {
    setTables((prev) => [...prev, { entity: "", table: "", id_column: "id" }]);
  }

  function removeTable(index: number) {
    setTables((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    if (!language || !database) return;
    setGenerating(true);
    setErrorMessage(null);
    setTestResult(null);
    try {
      const res = await developerService.generateConnector({
        language,
        database,
        filename: filename || undefined,
        connection,
        tables: tables.filter((t) => t.entity.trim() && t.table.trim()),
      });
      setCode(res.code);
      setFilename(res.filename);
      setStep("code");
      rememberPreferences(language, database, connection.connector_url);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not generate the connector");
    } finally {
      setGenerating(false);
    }
  }

  async function runTest() {
    if (!database) return;
    setTesting(true);
    setTestResult(null);
    setErrorMessage(null);
    try {
      const res = await developerService.testConnector({
        database,
        connection,
        tables: tables.filter((t) => t.entity.trim() && t.table.trim()),
      });
      setTestResult(res);
      if (res.connected && language) {
        rememberPreferences(language, database, connection.connector_url);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof GatewayError ? err.message : err instanceof Error ? err.message : "Test failed",
      );
    } finally {
      setTesting(false);
    }
  }

  function handleTest() {
    // Nothing to test against yet - no deployed Connector URL and no
    // direct host/file path either. Rather than let this fail with a
    // generic connection error, ask for the URL they may have simply
    // forgotten to paste in, so it gets saved and tested in one step.
    if (!connection.connector_url.trim() && !connection.host.trim()) {
      setUrlPromptValue("");
      setUrlPromptOpen(true);
      return;
    }
    runTest();
  }

  function handleUrlPromptSave() {
    setConnection((c) => ({ ...c, connector_url: urlPromptValue.trim() }));
    setUrlPromptOpen(false);
    // Run the test right after the URL lands in state.
    setTimeout(() => runTest(), 0);
  }

  function handleUrlPromptSkip() {
    setUrlPromptOpen(false);
    runTest();
  }

  function handleCopy() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!code) return;
    const name = filename || `orbit-connector.${CONNECTOR_LANGUAGE_EXTENSIONS[language ?? "javascript"]}`;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setStep("language");
    setLanguage(null);
    setDatabase(null);
    setConnection(DEFAULT_CONNECTION);
    setTables(DEFAULT_TABLES);
    setFilename("");
    setCode(null);
    setTestResult(null);
    setErrorMessage(null);
    setRestoredFromMemory(false);
  }

  return (
    <>
    <Card>
      {errorMessage && (
        <p role="alert" className="mb-3 text-sm text-signal-red">
          {errorMessage}
        </p>
      )}

      {restoredFromMemory && loadedPreferences && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded border border-graphite-700 bg-graphite-900 px-3 py-2 text-xs text-graphite-600">
          <span>
            Loaded your saved settings - {CONNECTOR_LANGUAGE_LABELS[loadedPreferences.language]} ·{" "}
            {CONNECTOR_DATABASE_LABELS[loadedPreferences.database]}
            {loadedPreferences.connector_url ? " · Connector URL remembered" : ""}.
          </span>
          <Button variant="ghost" onClick={reset} className="py-1 text-xs">
            Start fresh instead
          </Button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2 text-xs text-graphite-600">
        {(["language", "database", "configure", "code"] as Step[]).map((s, i) => (
          <span
            key={s}
            className={`rounded-full border px-2 py-1 ${
              step === s ? "border-signal-amber text-paper" : "border-graphite-700"
            }`}
          >
            {i + 1}. {s === "language" ? "Language" : s === "database" ? "Database" : s === "configure" ? "Connect & map tables" : "Code"}
          </span>
        ))}
      </div>

      {step === "language" && (
        <div>
          <p className="mb-3 text-sm text-graphite-600">
            What language should Orbit generate your connector in?
          </p>
          <div className="flex flex-wrap gap-2">
            {CONNECTOR_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setLanguage(lang);
                  setStep("database");
                }}
                className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                  language === lang
                    ? "border-signal-amber text-paper"
                    : "border-graphite-600 text-graphite-600 hover:text-paper"
                }`}
              >
                {CONNECTOR_LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "database" && (
        <div>
          <p className="mb-3 text-sm text-graphite-600">
            Which database does your system use?
          </p>
          <div className="flex flex-wrap gap-2">
            {CONNECTOR_DATABASES.map((db) => (
              <button
                key={db}
                type="button"
                onClick={() => {
                  setDatabase(db);
                  setStep("configure");
                }}
                className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                  database === db
                    ? "border-signal-amber text-paper"
                    : "border-graphite-600 text-graphite-600 hover:text-paper"
                }`}
              >
                {CONNECTOR_DATABASE_LABELS[db]}
              </button>
            ))}
          </div>
          <Button variant="ghost" className="mt-4" onClick={() => setStep("language")}>
            Back
          </Button>
        </div>
      )}

      {step === "configure" && language && database && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-graphite-600">
              {database === "sqlite" ? "Database file" : "Database connection"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-graphite-600">
                {database === "sqlite" ? "File path" : "Host"}
                <Input
                  value={connection.host}
                  onChange={(e) => setConnection((c) => ({ ...c, host: e.target.value }))}
                  placeholder={database === "sqlite" ? "./data/app.sqlite" : "db.yourcompany.com"}
                />
              </label>
              {database !== "sqlite" && (
                <label className="flex flex-col gap-1 text-xs text-graphite-600">
                  Port
                  <Input
                    value={connection.port}
                    onChange={(e) => setConnection((c) => ({ ...c, port: e.target.value }))}
                    placeholder="5432"
                  />
                </label>
              )}
              <label className="flex flex-col gap-1 text-xs text-graphite-600">
                {database === "sqlite" ? "File path (again, used to connect)" : "Database name"}
                <Input
                  value={connection.database}
                  onChange={(e) => setConnection((c) => ({ ...c, database: e.target.value }))}
                  placeholder={database === "sqlite" ? "./data/app.sqlite" : "your_database"}
                />
              </label>
              {database !== "sqlite" && (
                <>
                  <label className="flex flex-col gap-1 text-xs text-graphite-600">
                    Username
                    <Input
                      value={connection.username}
                      onChange={(e) => setConnection((c) => ({ ...c, username: e.target.value }))}
                      placeholder="orbit_reader"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-graphite-600">
                    Password
                    <Input
                      type="password"
                      value={connection.password}
                      onChange={(e) => setConnection((c) => ({ ...c, password: e.target.value }))}
                      placeholder="Only used to run Test Connection below - never saved, never written into the code"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-graphite-600">
                    <input
                      type="checkbox"
                      checked={connection.ssl}
                      onChange={(e) => setConnection((c) => ({ ...c, ssl: e.target.checked }))}
                    />
                    Use SSL/TLS
                  </label>
                </>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-graphite-600">
              Or: call a deployed connector URL instead
            </p>
            <p className="mb-2 text-xs text-graphite-600">
              If Orbit can&apos;t reach your database directly (common on shared hosting), generate
              the code below, deploy it yourself, then paste its live URL here. When this is set,
              Orbit calls that URL for <span className="font-mono">?entity=...</span> reads instead
              of connecting to the host/port above - it takes priority whenever it&apos;s filled in.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-graphite-600">
                Connector URL
                <Input
                  value={connection.connector_url}
                  onChange={(e) => setConnection((c) => ({ ...c, connector_url: e.target.value }))}
                  placeholder="https://yourcompany.com/orbit-connector.php"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-graphite-600">
                Connector token (optional)
                <Input
                  type="password"
                  value={connection.connector_token}
                  onChange={(e) => setConnection((c) => ({ ...c, connector_token: e.target.value }))}
                  placeholder="Only needed if you set ORBIT_CONNECTOR_TOKEN in the deployed file - open by default"
                />
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-graphite-600">
              Where is your data? Map each Orbit entity to your real table{database === "mongodb" ? "/collection" : ""} name.
            </p>
            <div className="flex flex-col gap-2">
              {tables.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                  <Input
                    value={t.entity}
                    onChange={(e) => updateTable(i, { entity: e.target.value })}
                    placeholder="Orbit entity, e.g. employees"
                  />
                  <Input
                    value={t.table}
                    onChange={(e) => updateTable(i, { table: e.target.value })}
                    placeholder={database === "mongodb" ? "your collection name" : "your table name"}
                  />
                  <Input
                    value={t.id_column}
                    onChange={(e) => updateTable(i, { id_column: e.target.value })}
                    placeholder="id column"
                  />
                  <Button variant="ghost" onClick={() => removeTable(i)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="mt-2" onClick={addTable}>
              + Add another table
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setStep("database")}>
              Back
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating…" : "Generate connector code"}
            </Button>
          </div>
        </div>
      )}

      {step === "code" && code && language && database && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs text-graphite-600">
            Filename
            <Input value={filename} onChange={(e) => setFilename(e.target.value)} />
          </label>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-graphite-600">
              Generated code - edit freely before you download it
            </p>
            <Textarea
              rows={18}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="max-h-[32rem]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="ghost" onClick={handleDownload}>
              Download {filename}
            </Button>
            <Button variant="ghost" onClick={() => setStep("configure")}>
              Edit connection / tables
            </Button>
            <Button variant="ghost" onClick={reset}>
              Start over
            </Button>
          </div>

          <div className="border-t border-graphite-700 pt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-graphite-600">Test Connection</p>
            <p className="mb-2 text-xs text-graphite-600">
              Runs a live, read-only check against your database using what you entered above.
              Orbit does not save anything from this test - it only shows you what it can see, every
              time you click it.
            </p>
            <Button onClick={handleTest} disabled={testing}>
              {testing ? "Testing…" : "Test connection"}
            </Button>

            {testResult && (
              <div className="mt-3 rounded bg-graphite-900 p-3 text-xs">
                <p className={testResult.connected ? "text-signal-green" : "text-signal-red"}>
                  {testResult.connected ? "Connected" : "Could not connect"}
                </p>
                {testResult.error && <p className="mt-1 text-signal-red">{testResult.error}</p>}
                <p className="mt-1 text-graphite-600">
                  Tested just now · not saved by Orbit
                </p>

                {testResult.tables.length > 0 && (
                  <div className="mt-3 flex flex-col gap-3">
                    {testResult.tables.map((t) => (
                      <div key={t.entity} className="rounded border border-graphite-700 p-2">
                        <p className="text-paper">
                          {t.entity} → <span className="font-mono">{t.table}</span>{" "}
                          {t.reachable ? (
                            <span className="text-signal-green">reachable</span>
                          ) : (
                            <span className="text-signal-red">not reachable</span>
                          )}
                        </p>
                        {t.error && <p className="mt-1 text-signal-red">{t.error}</p>}
                        {t.reachable && (
                          <>
                            <p className="mt-1 text-graphite-600">
                              Columns: {t.columns.join(", ") || "—"}
                              {t.row_count !== null && ` · ${t.row_count} rows total`}
                            </p>
                            {t.sample_rows.length > 0 && (
                              <pre className="mt-1 whitespace-pre-wrap font-mono text-paper">
                                {JSON.stringify(t.sample_rows, null, 2)}
                              </pre>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>

    {urlPromptOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <Card className="w-full max-w-md">
          <p className="text-sm text-paper">Add your Connector URL</p>
          <p className="mt-2 text-xs text-graphite-600">
            Test Connection needs either a database host or a deployed Connector URL to check -
            neither is filled in yet. If you&apos;ve already deployed the generated file
            somewhere, paste its live URL below and Orbit will save it and test it right away.
          </p>
          <Input
            className="mt-3"
            autoFocus
            value={urlPromptValue}
            onChange={(e) => setUrlPromptValue(e.target.value)}
            placeholder="https://yourcompany.com/orbit-connector.php"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleUrlPromptSave} disabled={!urlPromptValue.trim()}>
              Save &amp; test
            </Button>
            <Button variant="ghost" onClick={handleUrlPromptSkip}>
              Skip - test direct connection instead
            </Button>
            <Button variant="ghost" onClick={() => setUrlPromptOpen(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    )}
    </>
  );
}