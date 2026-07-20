"use client";

import { useCallback, useEffect, useState } from "react";
import { securityService } from "@/core/services/security.service";
import { developerService } from "@/core/services/developer.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/core/utils/format";
import type { SecurityOverview } from "@/types/platform-admin";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

const STATUS_COLOR: Record<string, string> = {
  valid: "text-signal-green",
  invalid: "text-signal-red",
  not_configured: "text-graphite-600",
};

export default function SecurityPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<SecurityOverview | null>(null);
  const [rotating, setRotating] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [busyKeyId, setBusyKeyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setState("loading");
    securityService
      .overview<SecurityOverview>()
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

  async function handleRotate() {
    setRotating(true);
    setErrorMessage(null);
    try {
      const res = await developerService.rotateWebhookSecret();
      setRevealedSecret(res.webhook_secret);
      load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not rotate secret");
    } finally {
      setRotating(false);
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Security</h1>
        <p className="text-sm text-graphite-600">
          API keys, webhook credential status, who has access, and recent security-relevant
          activity, all in one place.
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

      {state === "ready" && data && (
        <>
          {errorMessage && (
            <p role="alert" className="text-sm text-signal-red">
              {errorMessage}
            </p>
          )}
          {!data.you.can_edit && (
            <p className="text-xs text-graphite-600">
              Read-only - only the Company Owner or an admin can rotate secrets or revoke keys.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <p className="mb-2 text-xs uppercase tracking-wide text-graphite-600">
                Certificate status
              </p>
              <p className={`text-sm ${STATUS_COLOR[data.certificate_status.status]}`}>
                {data.certificate_status.status.replace("_", " ")}
              </p>
              <p className="mt-1 text-xs text-graphite-600">{data.certificate_status.detail}</p>
            </Card>

            <Card>
              <p className="mb-2 text-xs uppercase tracking-wide text-graphite-600">
                Webhook secret
              </p>
              {data.webhook_secret.configured ? (
                <>
                  <p className="text-sm text-signal-green">configured</p>
                  <p className="mt-1 text-xs text-graphite-600">
                    Created {formatDateTime(data.webhook_secret.created_at!)}
                    {data.webhook_secret.rotated_at &&
                      ` · rotated ${formatDateTime(data.webhook_secret.rotated_at)}`}
                  </p>
                  {data.you.can_edit && (
                    <Button
                      variant="ghost"
                      className="mt-2"
                      onClick={handleRotate}
                      disabled={rotating}
                    >
                      {rotating ? "Rotating…" : "Rotate now"}
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-graphite-600">
                  Not configured - generate one from the Developer page.
                </p>
              )}

              {revealedSecret && (
                <div className="mt-3 rounded border border-signal-amber/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-signal-amber">
                    Copy this now - it won&apos;t be shown again
                  </p>
                  <p className="mt-2 break-all rounded bg-graphite-900 p-2 font-mono text-xs text-paper">
                    {revealedSecret}
                  </p>
                  <Button className="mt-2" onClick={() => setRevealedSecret(null)}>
                    Done
                  </Button>
                </div>
              )}
            </Card>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">API keys</p>
            <Card>
              {data.api_keys.active.length === 0 && data.api_keys.revoked.length === 0 ? (
                <p className="text-sm text-graphite-600">No API keys yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-graphite-700">
                  {[...data.api_keys.active, ...data.api_keys.revoked].map((k) => (
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
                      ) : data.you.can_edit ? (
                        <Button
                          variant="ghost"
                          onClick={() => handleRevoke(k.id)}
                          disabled={busyKeyId === k.id}
                        >
                          {busyKeyId === k.id ? "Revoking…" : "Revoke"}
                        </Button>
                      ) : (
                        <span className="font-mono text-xs text-signal-green">active</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Ownership &amp; permissions
            </p>
            <Card>
              <ul className="flex flex-col divide-y divide-graphite-700">
                {data.ownership.members.map((m) => (
                  <li key={m.email} className="flex items-center justify-between py-3">
                    <span className="text-sm text-paper">{m.email}</span>
                    <span className="font-mono text-xs text-graphite-600">
                      {m.role}
                      {m.role !== "owner" && " · read-only on Blueprint"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-graphite-600">
                Only the Company Owner may modify the Company Blueprint. Other roles can view it
                and manage day-to-day operations.
              </p>
            </Card>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
              Recent activity
            </p>
            <Card>
              {data.recent_activity.length === 0 ? (
                <p className="text-sm text-graphite-600">Nothing yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-graphite-700">
                  {data.recent_activity.map((a, i) => (
                    <li key={i} className="py-2 text-xs">
                      <span className="font-mono text-paper">{a.action}</span>
                      <span className="text-graphite-600">
                        {" "}
                        · {a.actor_email ?? "system"} · {formatDateTime(a.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
