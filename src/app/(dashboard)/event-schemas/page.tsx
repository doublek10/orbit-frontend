"use client";

import { useCallback, useEffect, useState } from "react";
import { schemaService } from "@/core/services/schema.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateTime } from "@/core/utils/format";
import type {
  EventSchema,
  EventSchemasList,
  SchemaFieldType,
  SchemaValidateResult,
  SchemaValidationRule,
  SchemaVersionSummary,
} from "@/types/platform";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

function emptyRule(field = ""): SchemaValidationRule {
  return { field, type: "string" };
}

export default function EventSchemasPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [schemas, setSchemas] = useState<EventSchema[]>([]);
  const [exampleNames, setExampleNames] = useState<string[]>([]);
  const [ruleTypes, setRuleTypes] = useState<SchemaFieldType[]>(["string", "number", "boolean"]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [optionalFields, setOptionalFields] = useState<string[]>([]);
  const [newRequiredField, setNewRequiredField] = useState("");
  const [newOptionalField, setNewOptionalField] = useState("");
  const [rules, setRules] = useState<SchemaValidationRule[]>([]);
  const [saving, setSaving] = useState(false);

  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [validatePayloadText, setValidatePayloadText] = useState("{}");
  const [validateResult, setValidateResult] = useState<SchemaValidateResult | null>(null);
  const [validating, setValidating] = useState(false);

  const [versionsFor, setVersionsFor] = useState<string | null>(null);
  const [versions, setVersions] = useState<SchemaVersionSummary[]>([]);

  const [actingId, setActingId] = useState<string | null>(null);

  const allFields = [...requiredFields, ...optionalFields];

  const load = useCallback(() => {
    setState("loading");
    schemaService
      .list<EventSchemasList>()
      .then((res) => {
        setSchemas(res.schemas);
        setExampleNames(res.example_event_names);
        setRuleTypes(res.rule_types);
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

  function resetForm() {
    setEditingId(null);
    setEventName("");
    setDescription("");
    setRequiredFields([]);
    setOptionalFields([]);
    setRules([]);
  }

  function addRequiredField() {
    const f = newRequiredField.trim();
    if (f && !requiredFields.includes(f) && !optionalFields.includes(f)) {
      setRequiredFields((prev) => [...prev, f]);
    }
    setNewRequiredField("");
  }

  function addOptionalField() {
    const f = newOptionalField.trim();
    if (f && !requiredFields.includes(f) && !optionalFields.includes(f)) {
      setOptionalFields((prev) => [...prev, f]);
    }
    setNewOptionalField("");
  }

  function removeField(field: string) {
    setRequiredFields((prev) => prev.filter((f) => f !== field));
    setOptionalFields((prev) => prev.filter((f) => f !== field));
    setRules((prev) => prev.filter((r) => r.field !== field));
  }

  function addRule() {
    if (allFields.length === 0) return;
    setRules((prev) => [...prev, emptyRule(allFields[0])]);
  }

  function updateRule(index: number, patch: Partial<SchemaValidationRule>) {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!eventName.trim() || requiredFields.length + optionalFields.length === 0) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      await schemaService.save({
        event_name: eventName.trim(),
        description,
        required_fields: requiredFields,
        optional_fields: optionalFields,
        validation_rules: rules,
      });
      resetForm();
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not save schema");
    } finally {
      setSaving(false);
    }
  }

  function editSchema(s: EventSchema) {
    setEditingId(s.id);
    setEventName(s.event_name);
    setDescription(s.description);
    setRequiredFields(s.required_fields);
    setOptionalFields(s.optional_fields);
    setRules(s.validation_rules);
    setVersionsFor(null);
  }

  async function handleDelete(id: string) {
    setActingId(id);
    try {
      await schemaService.delete(id);
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not delete schema");
    } finally {
      setActingId(null);
    }
  }

  async function handleValidate(id: string) {
    setValidating(true);
    setValidateResult(null);
    try {
      const parsed = JSON.parse(validatePayloadText);
      const res = await schemaService.validate(id, parsed);
      setValidateResult(res);
    } catch (err) {
      setErrorMessage(
        err instanceof SyntaxError
          ? "That's not valid JSON."
          : err instanceof Error
            ? err.message
            : "Could not validate payload",
      );
    } finally {
      setValidating(false);
    }
  }

  async function toggleVersions(id: string) {
    if (versionsFor === id) {
      setVersionsFor(null);
      return;
    }
    setVersionsFor(id);
    try {
      const res = await schemaService.versions<{ versions: SchemaVersionSummary[] }>(id);
      setVersions(res.versions);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not load version history");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Event Schema Builder</h1>
        <p className="text-sm text-graphite-600">
          Define your own event types with required fields, optional fields, and validation
          rules. The Schema Engine rejects any payload that doesn&apos;t fit.
        </p>
      </div>

      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading schemas…</p>
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
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              {editingId ? "Edit schema" : "Create an event schema"}
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs text-graphite-600">Event name</label>
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. payment.received"
                  list="example-event-names"
                />
                <datalist id="example-event-names">
                  {exampleNames.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
                <div className="mt-2 flex flex-wrap gap-2">
                  {exampleNames.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEventName(n)}
                      className="rounded-full border border-graphite-600 px-2 py-0.5 font-mono text-xs text-graphite-600 hover:border-signal-amber hover:text-paper"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-graphite-600">Description</label>
                <Textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-graphite-600">Required fields</label>
                  <div className="flex gap-2">
                    <Input
                      value={newRequiredField}
                      onChange={(e) => setNewRequiredField(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addRequiredField()}
                      placeholder="e.g. amount"
                    />
                    <Button variant="ghost" onClick={addRequiredField}>
                      Add
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {requiredFields.map((f) => (
                      <span
                        key={f}
                        className="flex items-center gap-1 rounded-full bg-graphite-800 px-2 py-0.5 font-mono text-xs text-paper"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => removeField(f)}
                          className="text-graphite-600 hover:text-signal-red"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-graphite-600">Optional fields</label>
                  <div className="flex gap-2">
                    <Input
                      value={newOptionalField}
                      onChange={(e) => setNewOptionalField(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addOptionalField()}
                      placeholder="e.g. memo"
                    />
                    <Button variant="ghost" onClick={addOptionalField}>
                      Add
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {optionalFields.map((f) => (
                      <span
                        key={f}
                        className="flex items-center gap-1 rounded-full bg-graphite-800 px-2 py-0.5 font-mono text-xs text-graphite-600"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => removeField(f)}
                          className="text-graphite-600 hover:text-signal-red"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-graphite-600">Validation rules</label>
                  <Button variant="ghost" onClick={addRule} disabled={allFields.length === 0}>
                    + Add rule
                  </Button>
                </div>
                {rules.length === 0 ? (
                  <p className="mt-1 text-xs text-graphite-600">No rules yet - fields are still required/optional without one.</p>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    {rules.map((r, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2 rounded border border-graphite-700 p-2">
                        <select
                          value={r.field}
                          onChange={(e) => updateRule(i, { field: e.target.value })}
                          className="rounded border border-graphite-700 bg-graphite-900 px-2 py-1 text-xs text-paper"
                        >
                          {allFields.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                        <select
                          value={r.type}
                          onChange={(e) =>
                            updateRule(i, { type: e.target.value as SchemaFieldType })
                          }
                          className="rounded border border-graphite-700 bg-graphite-900 px-2 py-1 text-xs text-paper"
                        >
                          {ruleTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        {r.type === "number" && (
                          <>
                            <input
                              type="number"
                              placeholder="min"
                              value={r.min ?? ""}
                              onChange={(e) =>
                                updateRule(i, {
                                  min: e.target.value === "" ? undefined : Number(e.target.value),
                                })
                              }
                              className="w-20 rounded border border-graphite-700 bg-graphite-900 px-2 py-1 text-xs text-paper"
                            />
                            <input
                              type="number"
                              placeholder="max"
                              value={r.max ?? ""}
                              onChange={(e) =>
                                updateRule(i, {
                                  max: e.target.value === "" ? undefined : Number(e.target.value),
                                })
                              }
                              className="w-20 rounded border border-graphite-700 bg-graphite-900 px-2 py-1 text-xs text-paper"
                            />
                          </>
                        )}
                        <input
                          type="text"
                          placeholder="enum (comma-separated, optional)"
                          value={r.enum?.join(",") ?? ""}
                          onChange={(e) =>
                            updateRule(i, {
                              enum: e.target.value
                                ? e.target.value.split(",").map((v) => v.trim())
                                : undefined,
                            })
                          }
                          className="flex-1 rounded border border-graphite-700 bg-graphite-900 px-2 py-1 text-xs text-paper"
                        />
                        <button
                          type="button"
                          onClick={() => removeRule(i)}
                          className="text-xs text-graphite-600 hover:text-signal-red"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleSave}
                disabled={
                  saving || !eventName.trim() || requiredFields.length + optionalFields.length === 0
                }
              >
                {saving ? "Saving…" : editingId ? "Update schema" : "Save schema"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </Card>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Saved schemas
            </p>
            {schemas.length === 0 ? (
              <Card>
                <p className="text-sm text-graphite-600">No event schemas defined yet.</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {schemas.map((s) => (
                  <Card key={s.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-display text-paper">{s.event_name}</p>
                        {s.description && (
                          <p className="mt-1 text-xs text-graphite-600">{s.description}</p>
                        )}
                        <p className="mt-1 text-xs text-graphite-600">
                          {s.required_fields.length} required · {s.optional_fields.length}{" "}
                          optional · {s.validation_rules.length} rule
                          {s.validation_rules.length === 1 ? "" : "s"} · v{s.version} · updated{" "}
                          {formatDateTime(s.updated_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => editSchema(s)}>
                          Edit
                        </Button>
                        <Button variant="ghost" onClick={() => toggleVersions(s.id)}>
                          Versions
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDelete(s.id)}
                          disabled={actingId === s.id}
                        >
                          {actingId === s.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </div>

                    {versionsFor === s.id && (
                      <div className="mt-3 rounded bg-graphite-900 p-3 text-xs">
                        {versions.length === 0 ? (
                          <p className="text-graphite-600">No history yet.</p>
                        ) : (
                          <ul className="flex flex-col gap-1">
                            {versions.map((v) => (
                              <li key={v.version} className="text-graphite-600">
                                v{v.version} · {v.created_by_email} ·{" "}
                                {formatDateTime(v.created_at)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="mt-3 border-t border-graphite-700 pt-3">
                      {validatingId === s.id ? (
                        <div>
                          <label className="mb-1 block text-xs text-graphite-600">
                            Test payload
                          </label>
                          <Textarea
                            rows={4}
                            className="font-mono"
                            value={validatePayloadText}
                            onChange={(e) => setValidatePayloadText(e.target.value)}
                          />
                          <div className="mt-2 flex gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => handleValidate(s.id)}
                              disabled={validating}
                            >
                              {validating ? "Validating…" : "Validate"}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setValidatingId(null);
                                setValidateResult(null);
                              }}
                            >
                              Close
                            </Button>
                          </div>
                          {validateResult && (
                            <div className="mt-2 rounded bg-graphite-900 p-3 text-xs">
                              <p className={validateResult.valid ? "text-signal-green" : "text-signal-red"}>
                                {validateResult.valid ? "Valid" : "Invalid"}
                              </p>
                              {validateResult.errors.length > 0 && (
                                <ul className="mt-1 flex flex-col gap-0.5 text-signal-red">
                                  {validateResult.errors.map((e, i) => (
                                    <li key={i}>{e}</li>
                                  ))}
                                </ul>
                              )}
                              {validateResult.warnings.length > 0 && (
                                <ul className="mt-1 flex flex-col gap-0.5 text-signal-amber">
                                  {validateResult.warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setValidatingId(s.id);
                            setValidateResult(null);
                          }}
                        >
                          Test a payload against this schema
                        </Button>
                      )}
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
