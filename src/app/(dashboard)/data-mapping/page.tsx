"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mappingService } from "@/core/services/mapping.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateTime } from "@/core/utils/format";
import type { DataMapping, MappingPreviewResult, MappingsList } from "@/types/platform";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

const SAMPLE_JSON = `{
  "invoiceNumber": "INV-1042",
  "customerName": "Acme Traders",
  "totalAmount": 15000
}`;

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value as object).length > 0
    ) {
      keys.push(...flattenKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

export default function DataMappingPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMappings, setSavedMappings] = useState<DataMapping[]>([]);
  const [canonicalFields, setCanonicalFields] = useState<string[]>([]);

  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [parsedPayload, setParsedPayload] = useState<Record<string, unknown> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sourceFields, setSourceFields] = useState<string[]>([]);

  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [mappingName, setMappingName] = useState("");
  const [loadedMappingId, setLoadedMappingId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState<MappingPreviewResult | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setState("loading");
    mappingService
      .list<MappingsList>()
      .then((res) => {
        setSavedMappings(res.mappings);
        setCanonicalFields(res.canonical_fields);
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

  function parseJson(text: string) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setParseError("Paste a single JSON object, not an array or a primitive.");
        setParsedPayload(null);
        setSourceFields([]);
        return;
      }
      setParsedPayload(parsed);
      setSourceFields(flattenKeys(parsed));
      setParseError(null);
    } catch {
      setParseError("That doesn't look like valid JSON.");
      setParsedPayload(null);
      setSourceFields([]);
    }
  }

  useEffect(() => {
    parseJson(jsonText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      setJsonText(text);
      parseJson(text);
    });
    e.target.value = "";
  }

  function assignField(target: string, source: string) {
    setAssignments((prev) => ({ ...prev, [target]: source }));
  }

  function clearAssignment(target: string) {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[target];
      return next;
    });
  }

  function fieldRules() {
    return Object.entries(assignments).map(([target, source]) => ({ source, target }));
  }

  async function handleSave() {
    if (!mappingName.trim() || fieldRules().length === 0 || !parsedPayload) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      await mappingService.save({
        name: mappingName.trim(),
        field_rules: fieldRules(),
        sample_payload: parsedPayload,
      });
      setMappingName("");
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not save mapping");
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    if (!parsedPayload || fieldRules().length === 0) return;
    setPreviewing(true);
    setPreviewResult(null);
    try {
      const res = await mappingService.preview({
        field_rules: fieldRules(),
        sample_payload: parsedPayload,
      });
      setPreviewResult(res);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not preview mapping");
    } finally {
      setPreviewing(false);
    }
  }

  function loadMapping(m: DataMapping) {
    setLoadedMappingId(m.id);
    setMappingName(m.name);
    const next: Record<string, string> = {};
    for (const rule of m.field_rules) next[rule.target] = rule.source;
    setAssignments(next);
    const text = JSON.stringify(m.sample_payload, null, 2);
    setJsonText(text);
    parseJson(text);
    setPreviewResult(null);
  }

  async function handleDelete(id: string) {
    setActingId(id);
    try {
      await mappingService.delete(id);
      if (loadedMappingId === id) {
        setLoadedMappingId(null);
        setAssignments({});
        setMappingName("");
      }
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not delete mapping");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Data Mapping</h1>
        <p className="text-sm text-graphite-600">
          Paste JSON from your own systems, then drag each field onto the Orbit field it means.
          The Transformation Engine uses this to turn your payloads into canonical events - the
          Kernel never has to change, only the mapping does.
        </p>
      </div>

      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading…</p>
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

      {state === "ready" && (
        <>
          {errorMessage && (
            <p role="alert" className="text-sm text-signal-red">
              {errorMessage}
            </p>
          )}

          <Card>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-graphite-600">
                1. Paste or upload JSON
              </p>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                  Upload file
                </Button>
              </div>
            </div>
            <Textarea
              className="mt-3 font-mono"
              rows={8}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                parseJson(e.target.value);
              }}
            />
            {parseError && <p className="mt-2 text-xs text-signal-red">{parseError}</p>}
          </Card>

          {parsedPayload && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
                  2. Source fields - drag onto a target
                </p>
                <div className="flex flex-wrap gap-2">
                  {sourceFields.map((field) => (
                    <div
                      key={field}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", field)}
                      className="cursor-grab rounded-full border border-graphite-600 bg-graphite-800 px-3 py-1 font-mono text-xs text-paper active:cursor-grabbing"
                    >
                      {field}
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
                  3. Canonical targets - drop here
                </p>
                <div className="flex flex-col gap-2">
                  {canonicalFields.map((target) => (
                    <div
                      key={target}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        assignField(target, e.dataTransfer.getData("text/plain"));
                      }}
                      className="flex items-center justify-between rounded-md border border-dashed border-graphite-600 px-3 py-2"
                    >
                      <span className="font-mono text-xs text-graphite-600">{target}</span>
                      {assignments[target] ? (
                        <span className="flex items-center gap-2">
                          <span className="rounded bg-graphite-800 px-2 py-0.5 font-mono text-xs text-signal-amber">
                            {assignments[target]}
                          </span>
                          <button
                            type="button"
                            onClick={() => clearAssignment(target)}
                            className="text-xs text-graphite-600 hover:text-signal-red"
                          >
                            ×
                          </button>
                        </span>
                      ) : (
                        <select
                          value=""
                          onChange={(e) => e.target.value && assignField(target, e.target.value)}
                          className="rounded border border-graphite-700 bg-graphite-900 px-2 py-1 text-xs text-graphite-600"
                        >
                          <option value="">drop or pick…</option>
                          {sourceFields.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {parsedPayload && (
            <Card>
              <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
                4. Save &amp; preview
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1">
                  <label className="mb-1 block text-xs text-graphite-600">Mapping name</label>
                  <Input
                    value={mappingName}
                    onChange={(e) => setMappingName(e.target.value)}
                    placeholder="e.g. Accounts Receivable Export"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving || !mappingName.trim() || fieldRules().length === 0}
                >
                  {saving ? "Saving…" : loadedMappingId ? "Update mapping" : "Save mapping"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handlePreview}
                  disabled={previewing || fieldRules().length === 0}
                >
                  {previewing ? "Previewing…" : "Preview"}
                </Button>
              </div>

              {previewResult && (
                <div className="mt-4 rounded bg-graphite-900 p-3 text-xs">
                  <p className="mb-1 text-graphite-600">Canonical event:</p>
                  <pre className="whitespace-pre-wrap font-mono text-paper">
                    {JSON.stringify(previewResult.canonical, null, 2)}
                  </pre>
                  {previewResult.warnings.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-0.5 text-signal-amber">
                      {previewResult.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          )}

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Saved mappings
            </p>
            {savedMappings.length === 0 ? (
              <Card>
                <p className="text-sm text-graphite-600">No mappings saved yet.</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {savedMappings.map((m) => (
                  <Card key={m.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display text-paper">{m.name}</p>
                        <p className="mt-1 text-xs text-graphite-600">
                          {m.field_rules.length} field{m.field_rules.length === 1 ? "" : "s"}{" "}
                          mapped · updated {formatDateTime(m.updated_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => loadMapping(m)}>
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDelete(m.id)}
                          disabled={actingId === m.id}
                        >
                          {actingId === m.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
