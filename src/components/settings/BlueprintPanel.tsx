"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { blueprintService } from "@/core/services/blueprint.service";
import { GatewayError } from "@/core/gateway/response";
import { formatDateTime } from "@/core/utils/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type {
  Blueprint,
  BlueprintCompareResult,
  BlueprintVersionSummary,
} from "@/types/platform";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

export function BlueprintPanel() {
  const router = useRouter();

  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const [versions, setVersions] = useState<BlueprintVersionSummary[]>([]);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  const [compareFrom, setCompareFrom] = useState<number | null>(null);
  const [compareTo, setCompareTo] = useState<number | null>(null);
  const [compareResult, setCompareResult] = useState<BlueprintCompareResult | null>(null);
  const [comparing, setComparing] = useState(false);

  const load = useCallback(() => {
    setState("loading");
    blueprintService
      .get()
      .then((res) => {
        setBlueprint(res.blueprint);
        setCanEdit(res.you_can_edit);
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

  function loadVersions() {
    setVersionsOpen(true);
    blueprintService
      .versions()
      .then((res) => {
        setVersions(res.versions);
        if (res.versions.length >= 2) {
          setCompareFrom(res.versions[1].version);
          setCompareTo(res.versions[0].version);
        }
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : "Could not load version history");
      });
  }

  async function handleRestore(version: number) {
    setRestoringVersion(version);
    setErrorMessage(null);
    try {
      await blueprintService.restore(version);
      load();
      loadVersions();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not restore that version");
    } finally {
      setRestoringVersion(null);
    }
  }

  async function handleCompare() {
    if (compareFrom == null || compareTo == null) return;
    setComparing(true);
    setCompareResult(null);
    try {
      const res = await blueprintService.compare(compareFrom, compareTo);
      setCompareResult(res);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not compare those versions");
    } finally {
      setComparing(false);
    }
  }

  if (state === "loading") {
    return (
      <Card>
        <p className="text-sm text-graphite-600">Loading Blueprint…</p>
      </Card>
    );
  }

  if (state === "not-implemented") {
    return (
      <Card>
        <p className="text-sm text-graphite-600">
          The Company Blueprint isn&apos;t implemented in the Kernel yet - the pipeline is wired
          end to end and returns an honest &quot;not built yet&quot;, not an error.
        </p>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card>
        <p role="alert" className="text-sm text-signal-red">
          {errorMessage}
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-graphite-600">Company Blueprint</p>
          {canEdit && (
            <Button variant="ghost" onClick={() => router.push("/onboarding")}>
              {blueprint ? "Update" : "Set up"}
            </Button>
          )}
        </div>

        {blueprint ? (
          <div className="mt-2 flex flex-col gap-1 text-sm text-paper">
            <p>
              Business type:{" "}
              <span className="font-mono text-xs text-graphite-600">
                {blueprint.business_type}
              </span>
            </p>
            <p>
              Priorities:{" "}
              <span className="font-mono text-xs text-graphite-600">
                {blueprint.priorities.join(", ") || "none set"}
              </span>
            </p>
            <p>
              Large transaction alerts:{" "}
              <span className="font-mono text-xs text-graphite-600">
                {blueprint.notify_on_large_transaction
                  ? `on, ≥ ${blueprint.large_transaction_threshold ?? "no threshold"}`
                  : "off"}
              </span>
            </p>
            <p>
              Intelligence capabilities:{" "}
              <span className="font-mono text-xs text-graphite-600">
                {blueprint.enabled_capabilities.length === 5
                  ? "all"
                  : blueprint.enabled_capabilities.join(", ") || "none"}
              </span>
            </p>
            <p>
              Intelligence category scope:{" "}
              <span className="font-mono text-xs text-graphite-600">
                {blueprint.allowed_categories ? blueprint.allowed_categories.join(", ") : "unrestricted"}
              </span>
            </p>
            <p className="text-xs text-graphite-600">
              Version {blueprint.version} · published {formatDateTime(blueprint.published_at)}
            </p>
            {!canEdit && (
              <p className="mt-1 text-xs text-graphite-600">
                Read-only - only the Company Owner can change the Blueprint.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-graphite-600">
            Not set up yet{canEdit ? " - tell Orbit how you want it to work for you." : "."}
          </p>
        )}

        {errorMessage && <p className="mt-2 text-xs text-signal-red">{errorMessage}</p>}

        {blueprint && (
          <button
            type="button"
            onClick={() => (versionsOpen ? setVersionsOpen(false) : loadVersions())}
            className="mt-3 text-xs text-signal-amber hover:underline"
          >
            {versionsOpen ? "Hide version history" : "View version history"}
          </button>
        )}
      </Card>

      {versionsOpen && (
        <Card>
          <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
            Version history
          </p>

          {versions.length === 0 ? (
            <p className="text-sm text-graphite-600">No versions yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-graphite-700">
              {versions.map((v) => (
                <li key={v.version} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-paper">
                      Version {v.version}
                      {v.version === blueprint?.version && (
                        <span className="ml-2 rounded bg-graphite-800 px-2 py-0.5 font-mono text-xs text-signal-green">
                          current
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-xs text-graphite-600">
                      {v.snapshot.business_type} · published by {v.published_by_email} ·{" "}
                      {formatDateTime(v.created_at)}
                    </p>
                  </div>
                  {canEdit && v.version !== blueprint?.version && (
                    <Button
                      variant="ghost"
                      onClick={() => handleRestore(v.version)}
                      disabled={restoringVersion !== null}
                    >
                      {restoringVersion === v.version ? "Restoring…" : "Restore"}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {versions.length >= 2 && (
            <div className="mt-4 border-t border-graphite-700 pt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-graphite-600">
                Compare versions
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs text-graphite-600">
                  From
                  <select
                    value={compareFrom ?? ""}
                    onChange={(e) => setCompareFrom(Number(e.target.value))}
                    className="rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2 text-sm text-paper focus:border-signal-amber"
                  >
                    {versions.map((v) => (
                      <option key={v.version} value={v.version}>
                        Version {v.version}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-graphite-600">
                  To
                  <select
                    value={compareTo ?? ""}
                    onChange={(e) => setCompareTo(Number(e.target.value))}
                    className="rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2 text-sm text-paper focus:border-signal-amber"
                  >
                    {versions.map((v) => (
                      <option key={v.version} value={v.version}>
                        Version {v.version}
                      </option>
                    ))}
                  </select>
                </label>
                <Button onClick={handleCompare} disabled={comparing}>
                  {comparing ? "Comparing…" : "Compare"}
                </Button>
              </div>

              {compareResult && (
                <div className="mt-3 rounded bg-graphite-900 p-3 text-xs">
                  {compareResult.identical ? (
                    <p className="text-graphite-600">
                      Versions {compareResult.from_version} and {compareResult.to_version} are
                      identical.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {compareResult.changed.map((c) => (
                        <li key={c.field} className="text-paper">
                          <span className="font-mono text-graphite-600">{c.field}</span>:{" "}
                          {JSON.stringify(c.from)} <span className="text-graphite-600">→</span>{" "}
                          {JSON.stringify(c.to)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
