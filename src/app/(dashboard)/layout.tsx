"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { blueprintService } from "@/core/services/blueprint.service";
import { GatewayError } from "@/core/gateway/response";
import { OrbitMark } from "@/components/shared/OrbitMark";

const NAV = [
  { href: "/overview", label: "Overview" },
  { href: "/providers", label: "Providers" },
  { href: "/business-systems", label: "Business Systems" },
  { href: "/data-mapping", label: "Data Mapping" },
  { href: "/event-schemas", label: "Event Schemas" },
  { href: "/security", label: "Security" },
  { href: "/workflows", label: "Workflows" },
  { href: "/insights", label: "Insights" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/replay", label: "Replay" },
  { href: "/settings", label: "Settings" },
  { href: "/developer", label: "Developer" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/enterprise", label: "Enterprise" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const router = useRouter();
  const [onboardChecked, setOnboardChecked] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  useEffect(() => {
    if (loading || !session) return;
    blueprintService
      .get()
      .then((res) => {
        if (!res.onboarded && res.you_can_edit) {
          router.replace("/onboarding");
          return;
        }
        setOnboardChecked(true);
      })
      .catch((err) => {
        // Honest fallback: if the check itself fails (Kernel not built
        // out yet, network hiccup), don't trap the person outside their
        // own dashboard - let them in and move on.
        if (err instanceof GatewayError && err.status === 501) {
          setOnboardChecked(true);
          return;
        }
        setOnboardChecked(true);
      });
  }, [loading, session, router]);

  if (loading || !session || !onboardChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <OrbitMark className="h-8 w-8 animate-pulse" />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col justify-between border-r border-graphite-700 bg-graphite-900 p-4">
        <div>
          <div className="mb-8 flex items-center gap-2">
            <OrbitMark className="h-7 w-7" />
            <span className="font-display text-sm tracking-wide">ORBIT</span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-graphite-600 hover:bg-graphite-800 hover:text-paper"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-graphite-700 pt-4">
          <p className="truncate font-mono text-xs text-graphite-600">{session.email}</p>
          <p className="truncate font-mono text-xs text-graphite-600">{session.companyName}</p>
          <button
            onClick={() => logout().then(() => router.replace("/login"))}
            className="mt-2 text-xs text-signal-amber hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
