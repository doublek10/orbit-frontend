"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { blueprintService } from "@/core/services/blueprint.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OrbitMark } from "@/components/shared/OrbitMark";
import type { BlueprintInput, BlueprintPriority, IntelligenceCapability } from "@/types/platform";

type LoadState = "checking" | "ready" | "not-owner" | "not-implemented" | "error";

const BUSINESS_TYPES = [
  { value: "retail", label: "Retail & e-commerce" },
  { value: "services", label: "Professional services" },
  { value: "agriculture", label: "Agriculture" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "technology", label: "Technology" },
  { value: "other", label: "Something else" },
];

const PRIORITIES: { value: BlueprintPriority; label: string; description: string }[] = [
  {
    value: "cash_flow_visibility",
    label: "Cash flow visibility",
    description: "Always know what's coming in and going out.",
  },
  {
    value: "expense_control",
    label: "Expense control",
    description: "Catch overspending before it becomes a problem.",
  },
  {
    value: "payroll_accuracy",
    label: "Payroll accuracy",
    description: "Payroll runs reflected in the ledger without manual work.",
  },
  {
    value: "fraud_and_risk_alerts",
    label: "Fraud & risk alerts",
    description: "Get flagged on anything unusual, fast.",
  },
  {
    value: "growth_forecasting",
    label: "Growth forecasting",
    description: "Model where the business is headed, not just where it's been.",
  },
];

const CAPABILITIES: { value: IntelligenceCapability; label: string; description: string }[] = [
  { value: "health", label: "Business health score", description: "The overall 0-100 health signal." },
  { value: "trend", label: "Cash flow trend", description: "Month-over-month net flow direction." },
  { value: "spend", label: "Spend concentration", description: "Which category is eating the most outflow." },
  { value: "anomaly", label: "Anomaly detection", description: "Unusual transactions flagged for review." },
  { value: "forecast", label: "Cash forecasting", description: "Projected balance 30/90 days out." },
];

const STEP_LABELS = ["Business", "Priorities", "Alerts", "Intelligence", "Review"];

export default function OnboardingPage() {
  const { session } = useAuth();
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>("checking");
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [businessType, setBusinessType] = useState<string>("");
  const [priorities, setPriorities] = useState<BlueprintPriority[]>([]);
  const [notifyOnLarge, setNotifyOnLarge] = useState(true);
  const [threshold, setThreshold] = useState("");
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [capabilities, setCapabilities] = useState<IntelligenceCapability[]>(
    CAPABILITIES.map((c) => c.value),
  );
  const [categoryScope, setCategoryScope] = useState<"all" | "restricted">("all");
  const [categoriesText, setCategoriesText] = useState("");

  useEffect(() => {
    blueprintService
      .get()
      .then((res) => {
        if (!res.you_can_edit) {
          setLoadState("not-owner");
          return;
        }
        if (res.blueprint) {
          setBusinessType(res.blueprint.business_type);
          setPriorities(res.blueprint.priorities);
          setNotifyOnLarge(res.blueprint.notify_on_large_transaction);
          setThreshold(
            res.blueprint.large_transaction_threshold != null
              ? String(res.blueprint.large_transaction_threshold)
              : "",
          );
          setWeeklyDigest(res.blueprint.weekly_digest);
          if (res.blueprint.enabled_capabilities?.length) {
            setCapabilities(res.blueprint.enabled_capabilities);
          }
          if (res.blueprint.allowed_categories) {
            setCategoryScope("restricted");
            setCategoriesText(res.blueprint.allowed_categories.join(", "));
          }
        }
        setLoadState("ready");
      })
      .catch((err) => {
        if (err instanceof GatewayError && err.status === 501) {
          setLoadState("not-implemented");
        } else {
          setLoadState("error");
          setError(err instanceof Error ? err.message : "Could not load setup status");
        }
      });
  }, []);

  const togglePriority = useCallback((value: BlueprintPriority) => {
    setPriorities((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    );
  }, []);

  const toggleCapability = useCallback((value: IntelligenceCapability) => {
    setCapabilities((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    );
  }, []);

  function canAdvance(): boolean {
    if (step === 0) return businessType !== "";
    if (step === 1) return priorities.length > 0;
    if (step === 3) return capabilities.length > 0;
    return true;
  }

  async function handlePublish() {
    setSubmitting(true);
    setError(null);
    try {
      const input: BlueprintInput = {
        business_type: businessType,
        priorities,
        large_transaction_threshold:
          notifyOnLarge && threshold.trim() !== "" ? Number(threshold) : null,
        notify_on_large_transaction: notifyOnLarge,
        weekly_digest: weeklyDigest,
        enabled_capabilities: capabilities,
        allowed_categories:
          categoryScope === "restricted"
            ? categoriesText
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
            : null,
      };
      await blueprintService.publish(input);
      router.push("/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish your Blueprint");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <OrbitMark className="h-8 w-8 animate-pulse" />
      </main>
    );
  }

  if (loadState === "not-owner") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <p className="text-sm text-graphite-600">
            Only the Company Owner can set up the Company Blueprint. You can keep using Orbit in
            the meantime - settings will show up here once the Owner publishes them.
          </p>
          <Button className="mt-4" onClick={() => router.push("/overview")}>
            Continue to dashboard
          </Button>
        </Card>
      </main>
    );
  }

  if (loadState === "not-implemented") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <p className="text-sm text-graphite-600">
            Setup isn&apos;t available from the Kernel yet - you can head to your dashboard and
            configure things there instead.
          </p>
          <Button className="mt-4" onClick={() => router.push("/overview")}>
            Go to dashboard
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <OrbitMark className="h-10 w-10" />
          <h1 className="font-display text-xl tracking-tight">
            Set up Orbit for {session?.companyName ?? "your company"}
          </h1>
          <p className="text-sm text-graphite-600">
            A few questions so Orbit knows how to work for you. You can change any of this later
            in Settings.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  i <= step
                    ? "bg-signal-amber text-graphite-950"
                    : "border border-graphite-600 text-graphite-600"
                }`}
              >
                {i + 1}
              </div>
              {i < STEP_LABELS.length - 1 && <div className="h-px w-6 bg-graphite-700" />}
            </div>
          ))}
        </div>

        {error && (
          <p role="alert" className="mb-4 text-sm text-signal-red">
            {error}
          </p>
        )}

        {step === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wide text-graphite-600">
              What kind of business is this?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBusinessType(option.value)}
                  className={`rounded-md border px-3 py-3 text-left text-sm transition-colors ${
                    businessType === option.value
                      ? "border-signal-amber bg-graphite-800 text-paper"
                      : "border-graphite-600 text-graphite-600 hover:border-graphite-700 hover:text-paper"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wide text-graphite-600">
              What matters most to you right now? Pick as many as apply.
            </p>
            <div className="flex flex-col gap-2">
              {PRIORITIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => togglePriority(option.value)}
                  className={`rounded-md border px-3 py-2 text-left transition-colors ${
                    priorities.includes(option.value)
                      ? "border-signal-amber bg-graphite-800"
                      : "border-graphite-600 hover:border-graphite-700"
                  }`}
                >
                  <p className="text-sm text-paper">{option.label}</p>
                  <p className="text-xs text-graphite-600">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-wide text-graphite-600">
              How should Orbit alert you?
            </p>

            <label className="flex items-start gap-2 text-sm text-paper">
              <input
                type="checkbox"
                checked={notifyOnLarge}
                onChange={(e) => setNotifyOnLarge(e.target.checked)}
                className="mt-1"
              />
              Notify me when a large transaction comes through
            </label>

            {notifyOnLarge && (
              <div>
                <label htmlFor="threshold" className="mb-1 block text-xs text-graphite-600">
                  Flag transactions at or above this amount
                </label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </div>
            )}

            <label className="flex items-start gap-2 text-sm text-paper">
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
                className="mt-1"
              />
              Send a weekly summary of my company&apos;s finances
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-wide text-graphite-600">
              What should the Intelligence Engine pay attention to?
            </p>
            <div className="flex flex-col gap-2">
              {CAPABILITIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleCapability(option.value)}
                  className={`rounded-md border px-3 py-2 text-left transition-colors ${
                    capabilities.includes(option.value)
                      ? "border-signal-amber bg-graphite-800"
                      : "border-graphite-600 hover:border-graphite-700"
                  }`}
                >
                  <p className="text-sm text-paper">{option.label}</p>
                  <p className="text-xs text-graphite-600">{option.description}</p>
                </button>
              ))}
            </div>

            <div className="border-t border-graphite-700 pt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-graphite-600">
                Which ledger categories can it analyze?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryScope("all")}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    categoryScope === "all"
                      ? "border-signal-amber bg-graphite-800 text-paper"
                      : "border-graphite-600 text-graphite-600 hover:border-graphite-700"
                  }`}
                >
                  All categories
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryScope("restricted")}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    categoryScope === "restricted"
                      ? "border-signal-amber bg-graphite-800 text-paper"
                      : "border-graphite-600 text-graphite-600 hover:border-graphite-700"
                  }`}
                >
                  Only specific categories
                </button>
              </div>
              {categoryScope === "restricted" && (
                <div className="mt-3">
                  <label htmlFor="categories" className="mb-1 block text-xs text-graphite-600">
                    Comma-separated category names (e.g. rent, utilities, marketing)
                  </label>
                  <Input
                    id="categories"
                    placeholder="rent, utilities, marketing"
                    value={categoriesText}
                    onChange={(e) => setCategoriesText(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-graphite-600">
                    Your overall balance, health score, and cash flow trend stay visible either
                    way - this only controls which specific categories Intelligence can name in
                    spend and anomaly findings.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wide text-graphite-600">
              Review your Blueprint
            </p>
            <div className="rounded-md border border-graphite-700 bg-graphite-900 p-4 text-sm">
              <p className="text-paper">
                Business type:{" "}
                <span className="text-graphite-600">
                  {BUSINESS_TYPES.find((b) => b.value === businessType)?.label}
                </span>
              </p>
              <p className="mt-2 text-paper">Priorities:</p>
              <ul className="ml-4 list-disc text-graphite-600">
                {priorities.map((p) => (
                  <li key={p}>{PRIORITIES.find((o) => o.value === p)?.label}</li>
                ))}
              </ul>
              <p className="mt-2 text-paper">
                Large transaction alerts:{" "}
                <span className="text-graphite-600">
                  {notifyOnLarge
                    ? threshold
                      ? `on, at or above ${threshold}`
                      : "on, no threshold set"
                    : "off"}
                </span>
              </p>
              <p className="text-paper">
                Weekly digest:{" "}
                <span className="text-graphite-600">{weeklyDigest ? "on" : "off"}</span>
              </p>
              <p className="mt-2 text-paper">Intelligence capabilities:</p>
              <ul className="ml-4 list-disc text-graphite-600">
                {capabilities.map((c) => (
                  <li key={c}>{CAPABILITIES.find((o) => o.value === c)?.label}</li>
                ))}
              </ul>
              <p className="text-paper">
                Category scope:{" "}
                <span className="text-graphite-600">
                  {categoryScope === "all" ? "all categories" : categoriesText || "none entered"}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
          >
            Back
          </Button>

          {step < STEP_LABELS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
              Continue
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={submitting}>
              {submitting ? "Publishing…" : "Publish & enter Orbit"}
            </Button>
          )}
        </div>
      </Card>
    </main>
  );
}
