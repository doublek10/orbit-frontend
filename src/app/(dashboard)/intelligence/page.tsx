"use client";

import { useCallback, useEffect, useState } from "react";
import { intelligenceService, downloadCompiledReport } from "@/core/services/intelligence.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type {
  IntelligenceCompileResponse,
  IntelligenceDashboardResponse,
  IntelligenceNotification,
  IntelligenceNotificationsResponse,
  IntelligenceReport,
  IntelligenceReportsResponse,
  IntelligenceSeverity,
} from "@/types/intelligence";

type LoadState = "loading" | "ready" | "not-implemented" | "error";

const SEVERITY_STYLE: Record<IntelligenceSeverity, string> = {
  info: "border-l-graphite-600",
  warning: "border-l-signal-amber",
  critical: "border-l-signal-red",
};

const SEVERITY_BADGE: Record<IntelligenceSeverity, string> = {
  info: "bg-graphite-800 text-graphite-600",
  warning: "bg-signal-amber/15 text-signal-amber",
  critical: "bg-signal-red/15 text-signal-red",
};

export default function IntelligencePage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<IntelligenceDashboardResponse | null>(null);
  const [notifications, setNotifications] = useState<IntelligenceNotification[]>([]);
  const [reports, setReports] = useState<IntelligenceReport[]>([]);
  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);

  const load = useCallback(() => {
    setState("loading");
    Promise.all([
      intelligenceService.dashboard<IntelligenceDashboardResponse>(),
      intelligenceService.notifications<IntelligenceNotificationsResponse>({ limit: 10 }),
      intelligenceService.reports<IntelligenceReportsResponse>({ limit: 5 }),
    ])
      .then(([dashboardRes, notificationsRes, reportsRes]) => {
        setDashboard(dashboardRes);
        setNotifications(notificationsRes.notifications);
        setReports(reportsRes.reports);
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

  const markRead = (id: string) => {
    intelligenceService.markNotificationRead(id).then(load).catch(() => undefined);
  };

  const compile = () => {
    setCompiling(true);
    setCompileError(null);
    intelligenceService
      .compile<IntelligenceCompileResponse>()
      .then((result) => {
        downloadCompiledReport(result);
      })
      .catch((err) => {
        setCompileError(err instanceof Error ? err.message : "Could not compile the report");
      })
      .finally(() => setCompiling(false));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Intelligence</h1>
          <p className="text-sm text-graphite-600">
            The Intelligence Engine runs continuously in the background - observing events, building
            business knowledge, and generating reports and notifications. Nothing on this page is
            computed live in the browser; it's all read from what the Engine has already produced. If
            you've saved a Connector URL on the Developer page, the Engine also reads your live
            employees, invoices, inventory, and payments straight from your own systems.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Button onClick={compile} disabled={compiling || state !== "ready"}>
            {compiling ? "Compiling…" : "Compile"}
          </Button>
          <p className="max-w-[220px] text-right text-xs text-graphite-600">
            Downloads a full PDF report of how your company is faring right now.
          </p>
          {compileError && (
            <p role="alert" className="max-w-[220px] text-right text-xs text-signal-red">
              {compileError}
            </p>
          )}
        </div>
      </div>

      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading Intelligence Engine data…</p>
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

      {state === "ready" && dashboard && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-wide text-graphite-600">Business health</p>
              <p className="mt-2 font-display text-3xl text-paper">{dashboard.health.score}/100</p>
              <p className="mt-1 text-sm text-graphite-600 capitalize">{dashboard.health.label}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-graphite-600">Projected balance (30d)</p>
              <p className="mt-2 font-display text-3xl text-paper">
                {dashboard.forecast.projected_balance["30d"]}
              </p>
              <p className="mt-1 text-sm text-graphite-600">{dashboard.forecast.method}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-graphite-600">Engine status</p>
              <p className="mt-2 font-display text-3xl text-paper">
                {dashboard.status.active ? "Active" : "Inactive"}
              </p>
              <p className="mt-1 text-sm text-graphite-600">
                {dashboard.unread_notifications} unread · {dashboard.open_recommendations} open
                recommendations
              </p>
            </Card>
          </div>

          <div>
            <h2 className="font-display text-lg text-paper">Connected systems</h2>
            <div className="mt-3 flex flex-col gap-3">
              {!dashboard.connector?.connected ? (
                <Card>
                  <p className="text-sm text-graphite-600">
                    {dashboard.connector?.reason ??
                      "No Connector URL saved yet - connect one from the Developer page so the Engine can read your live business data."}
                  </p>
                </Card>
              ) : (
                <>
                  {dashboard.connector.discovered === false && (
                    <Card>
                      <p className="text-sm text-graphite-600">
                        Your connector didn&rsquo;t respond to entity discovery, so Orbit fell back to a
                        generic guess at table names below. Redeploy the latest connector file so Orbit can
                        discover your actual tables automatically.
                      </p>
                    </Card>
                  )}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {dashboard.connector.entities.map((entity) => (
                      <Card key={entity.entity}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-display text-base capitalize text-paper">{entity.entity}</p>
                          <span className="text-xs text-graphite-600">
                            {entity.reachable ? `${entity.row_count} record(s)` : "unavailable"}
                          </span>
                        </div>
                        {entity.reachable && entity.kind && entity.kind !== "generic" && entity.kind !== "unknown" && (
                          <p className="text-xs text-graphite-600">recognized as {entity.kind} data</p>
                        )}
                        {!entity.reachable ? (
                          <p className="mt-2 text-sm text-graphite-600">{entity.error}</p>
                        ) : (
                          <dl className="mt-2 flex flex-col gap-1 text-sm text-graphite-600">
                            {Object.entries(entity.summary)
                              .filter(([key]) => key !== "low_stock_items")
                              .map(([key, value]) => (
                                <div key={key} className="flex justify-between gap-4">
                                  <dt className="capitalize">{key.replace(/_/g, " ")}</dt>
                                  <dd className="text-paper">{String(value)}</dd>
                                </div>
                              ))}
                          </dl>
                        )}
                      </Card>
                    ))}
                  </div>
                  {dashboard.connector.relationships?.length > 0 && (
                    <Card>
                      <p className="font-display text-base text-paper">How your tables link together</p>
                      <ul className="mt-2 flex flex-col gap-1 text-sm text-graphite-600">
                        {dashboard.connector.relationships.map((rel) => (
                          <li key={`${rel.from_entity}-${rel.field}`}>
                            <span className="text-paper">{rel.from_entity}</span>.{rel.field} → {rel.likely_target_entity}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg text-paper">Findings</h2>
            <div className="mt-3 flex flex-col gap-3">
              {dashboard.findings.length === 0 ? (
                <Card>
                  <p className="text-sm text-graphite-600">
                    Not enough activity yet for the Engine to produce findings.
                  </p>
                </Card>
              ) : (
                dashboard.findings.map((finding) => (
                  <Card key={finding.id} className={`border-l-4 ${SEVERITY_STYLE[finding.severity]}`}>
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-display text-base text-paper">{finding.title}</p>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${SEVERITY_BADGE[finding.severity]}`}
                      >
                        {finding.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-graphite-600">{finding.message}</p>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg text-paper">Notifications</h2>
            <div className="mt-3 flex flex-col gap-3">
              {notifications.length === 0 ? (
                <Card>
                  <p className="text-sm text-graphite-600">No notifications yet.</p>
                </Card>
              ) : (
                notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`border-l-4 ${SEVERITY_STYLE[notification.severity]} ${notification.read_at ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-display text-base text-paper">{notification.title}</p>
                      {!notification.read_at && (
                        <button
                          onClick={() => markRead(notification.id)}
                          className="shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide text-graphite-600 hover:text-paper"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-graphite-600">{notification.message}</p>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg text-paper">Recent reports</h2>
            <div className="mt-3 flex flex-col gap-3">
              {reports.length === 0 ? (
                <Card>
                  <p className="text-sm text-graphite-600">
                    No reports yet - the first one is generated on the Engine's next scheduled cycle.
                  </p>
                </Card>
              ) : (
                reports.map((report) => (
                  <Card key={report.id}>
                    <div className="flex items-center justify-between">
                      <p className="font-display text-base text-paper capitalize">
                        {report.report_type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-graphite-600">
                        {new Date(report.generated_at).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
