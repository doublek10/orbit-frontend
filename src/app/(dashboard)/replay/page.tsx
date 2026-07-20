"use client";

import { useCallback, useEffect, useState } from "react";
import { replayService } from "@/core/services/replay.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatMoney } from "@/core/utils/format";
import type { ReplayResult } from "@/types/ai-replay";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

interface DraftScenario {
  label: string;
  kind: "one_time" | "recurring";
  amount: string;
  day_offset: string;
  frequency_days: string;
}

function emptyDraft(): DraftScenario {
  return { label: "", kind: "recurring", amount: "", day_offset: "0", frequency_days: "30" };
}

function ProjectionChart({ result }: { result: ReplayResult }) {
  const width = 640;
  const height = 200;
  const padding = 24;
  const values = result.series.map((p) => p.projected_balance);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = result.series.map((p, i) => {
    const x = padding + (i / Math.max(1, result.series.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.projected_balance - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const zeroY = height - padding - ((0 - min) / range) * (height - padding * 2);
  const lineColor = result.goes_negative_on_day !== null ? "#E0685B" : "#6FCF97";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#2A2E35" strokeDasharray="4 4" />
      <polyline points={points.join(" ")} fill="none" stroke={lineColor} strokeWidth="2" />
    </svg>
  );
}

export default function ReplayPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [scenarios, setScenarios] = useState<DraftScenario[]>([]);
  const [draft, setDraft] = useState<DraftScenario>(emptyDraft());
  const [running, setRunning] = useState(false);

  const loadDefault = useCallback(() => {
    setState("loading");
    replayService
      .defaultTrajectory<ReplayResult>()
      .then((res) => {
        setResult(res);
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
    loadDefault();
  }, [loadDefault]);

  function addScenario() {
    if (!draft.label.trim() || !draft.amount.trim()) return;
    setScenarios((prev) => [...prev, draft]);
    setDraft(emptyDraft());
  }

  function removeScenario(i: number) {
    setScenarios((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function runSimulation() {
    setRunning(true);
    try {
      const res = await replayService.simulate<ReplayResult>(
        scenarios.map((s) => ({
          label: s.label,
          kind: s.kind,
          amount: Number(s.amount),
          day_offset: Number(s.day_offset || 0),
          frequency_days: Number(s.frequency_days || 30),
        })),
        90,
      );
      setResult(res);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Replay</h1>
        <p className="text-sm text-graphite-600">
          Your Digital Financial Twin - simulate what-if scenarios against your real cash flow
          pattern. Nothing here ever touches your actual ledger.
        </p>
      </div>

      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading projection…</p>
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

      {result && (
        <>
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-graphite-600">
                  90-day projection
                </p>
                <p className="mt-1 font-display text-2xl text-paper">
                  {formatMoney(result.ending_balance, "KES")}
                </p>
              </div>
              {result.goes_negative_on_day !== null && (
                <span className="rounded bg-signal-red/15 px-3 py-1.5 text-xs text-signal-red">
                  Balance goes negative around day {result.goes_negative_on_day}
                </span>
              )}
            </div>
            <ProjectionChart result={result} />
            <div className="mt-3 flex justify-between text-xs text-graphite-600">
              <span>Starting: {formatMoney(result.starting_balance, "KES")}</span>
              <span>Lowest point: {formatMoney(result.min_balance, "KES")}</span>
            </div>
          </Card>

          <Card>
            <p className="mb-4 text-xs uppercase tracking-wide text-graphite-600">
              Add a what-if scenario
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-graphite-600">
                Label
                <Input
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  placeholder="New hire salary"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-graphite-600">
                Type
                <select
                  value={draft.kind}
                  onChange={(e) => setDraft({ ...draft, kind: e.target.value as DraftScenario["kind"] })}
                  className="rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2 text-sm text-paper"
                >
                  <option value="recurring">Recurring</option>
                  <option value="one_time">One-time</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-graphite-600">
                Amount (+ in / − out)
                <Input
                  value={draft.amount}
                  onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                  placeholder="-50000"
                />
              </label>
              {draft.kind === "recurring" ? (
                <label className="flex flex-col gap-1 text-xs text-graphite-600">
                  Every N days
                  <Input
                    value={draft.frequency_days}
                    onChange={(e) => setDraft({ ...draft, frequency_days: e.target.value })}
                  />
                </label>
              ) : (
                <label className="flex flex-col gap-1 text-xs text-graphite-600">
                  On day
                  <Input
                    value={draft.day_offset}
                    onChange={(e) => setDraft({ ...draft, day_offset: e.target.value })}
                  />
                </label>
              )}
              <Button variant="ghost" onClick={addScenario}>
                Add
              </Button>
            </div>

            {scenarios.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2">
                {scenarios.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded bg-graphite-900 px-3 py-2 text-xs text-paper"
                  >
                    <span>
                      {s.label} · {s.kind === "recurring" ? `every ${s.frequency_days}d` : `day ${s.day_offset}`} ·{" "}
                      {s.amount}
                    </span>
                    <button
                      onClick={() => removeScenario(i)}
                      className="text-graphite-600 hover:text-signal-red"
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Button className="mt-4" onClick={runSimulation} disabled={running}>
              {running ? "Simulating…" : "Run simulation"}
            </Button>
          </Card>
        </>
      )}
    </div>
  );
}
