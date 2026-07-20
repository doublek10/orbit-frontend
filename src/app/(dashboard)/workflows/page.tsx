"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { workflowService } from "@/core/services/workflow.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDateTime } from "@/core/utils/format";
import type { WorkflowsList } from "@/types/platform";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

const FIELD_OPTIONS = ["amount", "category", "direction", "description", "counterparty"];
const OP_OPTIONS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "does not equal" },
  { value: "gt", label: "is greater than" },
  { value: "gte", label: "is at least" },
  { value: "lt", label: "is less than" },
  { value: "lte", label: "is at most" },
  { value: "contains", label: "contains" },
];

export default function WorkflowsPage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<WorkflowsList | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [field, setField] = useState("amount");
  const [op, setOp] = useState("gt");
  const [value, setValue] = useState("");
  const [actionValue, setActionValue] = useState("needs-review");

  const load = useCallback(() => {
    setState("loading");
    workflowService
      .list<WorkflowsList>()
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !value.trim()) return;
    setSubmitting(true);
    try {
      await workflowService.create({
        name: name.trim(),
        trigger_event: "transaction.recorded",
        condition: { field, op, value: field === "amount" ? Number(value) : value },
        action: { type: "tag", value: actionValue },
      });
      setName("");
      setValue("");
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not create automation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Workflows</h1>
        <p className="text-sm text-graphite-600">
          Automate what happens as transactions land in your timeline - no code required.
        </p>
      </div>

      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading workflows…</p>
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
          <Card>
            <p className="mb-4 text-xs uppercase tracking-wide text-graphite-600">
              New automation
            </p>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-graphite-600">
                  Name
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Flag large payments"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-graphite-600">
                  Tag applied
                  <Input
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    placeholder="needs-review"
                    required
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <span className="pb-2 text-sm text-graphite-600">When transaction</span>
                <label className="flex flex-col gap-1 text-xs text-graphite-600">
                  Field
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2 text-sm text-paper"
                  >
                    {FIELD_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-graphite-600">
                  Condition
                  <select
                    value={op}
                    onChange={(e) => setOp(e.target.value)}
                    className="rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2 text-sm text-paper"
                  >
                    {OP_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-graphite-600">
                  Value
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={field === "amount" ? "50000" : "utilities"}
                    required
                  />
                </label>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving…" : "Create automation"}
                </Button>
              </div>
            </form>
          </Card>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Active automations
            </p>
            {data.automations.length === 0 ? (
              <Card>
                <p className="text-sm text-graphite-600">
                  No automations yet - create one above. It runs the moment a matching
                  transaction is recorded.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.automations.map((a) => (
                  <Card key={a.id}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-base text-paper">{a.name}</p>
                      {a.source === "blueprint" && (
                        <span className="shrink-0 rounded bg-signal-amber/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-signal-amber">
                          from Blueprint
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-xs text-graphite-600">
                      when {"field" in a.condition ? a.condition.field : "?"}{" "}
                      {"op" in a.condition ? a.condition.op : ""}{" "}
                      {"value" in a.condition ? String(a.condition.value) : ""} → tag &quot;
                      {a.action.value}&quot;
                    </p>
                    {a.source === "blueprint" && (
                      <button
                        type="button"
                        onClick={() => router.push("/settings")}
                        className="mt-2 text-xs text-signal-amber hover:underline"
                      >
                        Change the threshold in Settings →
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Recent automation runs
            </p>
            <Card>
              {data.recent_runs.length === 0 ? (
                <p className="text-sm text-graphite-600">
                  Nothing has triggered yet - runs appear here as matching transactions come in.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-graphite-700">
                  {data.recent_runs.map((run) => (
                    <li key={run.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm text-paper">{run.workflow_name}</p>
                        <p className="font-mono text-xs text-graphite-600">
                          {formatDateTime(run.created_at)}
                        </p>
                      </div>
                      <span className="rounded bg-signal-amber/15 px-2 py-1 font-mono text-xs text-signal-amber">
                        {String(run.action_result.value ?? run.action_result.message ?? "ran")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Platform capabilities
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {data.capabilities.map((c) => (
                <Card key={c.name}>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs text-paper">{c.name}</p>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                        c.status === "available"
                          ? "bg-signal-green/15 text-signal-green"
                          : "bg-graphite-700 text-graphite-600"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-graphite-600">{c.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
