"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/shared/AuthGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BlueprintPanel } from "@/components/settings/BlueprintPanel";
import { companyService } from "@/core/services/company.service";
import { GatewayError } from "@/core/gateway/response";
import { formatDate } from "@/core/utils/format";
import type { CompanyOverview } from "@/types/platform-admin";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

export default function SettingsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<CompanyOverview | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setState("loading");
    companyService
      .list<CompanyOverview>()
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

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await companyService.addMember(email.trim().toLowerCase());
      setEmail("");
      load();
    } catch (err) {
      if (err instanceof GatewayError) {
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : "Could not add member");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canManageTeam = data?.you.role === "owner" || data?.you.permissions.includes("*");

  return (
    <AuthGate title="Settings">
      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading settings…</p>
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
        <div className="flex flex-col gap-6">
          <Card>
            <p className="text-xs uppercase tracking-wide text-graphite-600">Company</p>
            <p className="mt-2 font-display text-2xl text-paper">{data.company.name}</p>
            <p className="mt-1 font-mono text-xs text-graphite-600">
              {data.company.country} · {data.company.id}
            </p>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-wide text-graphite-600">You</p>
            <p className="mt-2 text-sm text-paper">{data.you.email}</p>
            <p className="mt-1 font-mono text-xs text-graphite-600">
              role: {data.you.role} · grants: {data.you.permissions.join(", ") || "none"}
            </p>
          </Card>

          <BlueprintPanel />

          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">Team</p>
            <Card>
              <ul className="flex flex-col divide-y divide-graphite-700">
                {data.members.map((m) => (
                  <li key={m.email} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm text-paper">{m.full_name || m.email}</p>
                      <p className="font-mono text-xs text-graphite-600">
                        {m.email} · joined {formatDate(m.joined_at)}
                      </p>
                    </div>
                    <span className="rounded bg-graphite-800 px-2 py-1 font-mono text-xs text-graphite-600">
                      {m.role}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {canManageTeam && (
            <Card>
              <p className="mb-3 text-xs uppercase tracking-wide text-graphite-600">
                Add a team member
              </p>
              <p className="mb-3 text-xs text-graphite-600">
                They need an existing Orbit account (sign up first) - there&apos;s no email
                invite flow yet, so this only links an existing account to your company.
              </p>
              <form onSubmit={handleAddMember} className="flex items-end gap-3">
                <label className="flex flex-1 flex-col gap-1 text-xs text-graphite-600">
                  Email
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    required
                  />
                </label>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding…" : "Add member"}
                </Button>
              </form>
              {formError && <p className="mt-2 text-xs text-signal-red">{formError}</p>}
            </Card>
          )}
        </div>
      )}
    </AuthGate>
  );
}
