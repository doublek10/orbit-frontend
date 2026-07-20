"use client";

import { useCallback, useEffect, useState } from "react";
import { intelligenceService } from "@/core/services/intelligence.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import type {
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Intelligence</h1>
        <p className="text-sm text-graphite-600">
          The Intelligence Engine runs continuously in the background - observing events, building
          business knowledge, and generating reports and notifications. Nothing on this page is
          computed live in the browser; it's all read from what the Engine has already produced.
        </p>
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
