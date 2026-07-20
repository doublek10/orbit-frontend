"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { OrbitMark } from "@/components/shared/OrbitMark";

/**
 * This is the (marketing) surface for now - a minimal entry point. In a
 * real deployment, logged-out marketing content (pricing, product pages)
 * lives in the (marketing) route group; this page just decides where to
 * send someone the moment we know their session state.
 */
export default function RootPage() {
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? "/overview" : "/login");
  }, [loading, session, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <OrbitMark className="h-10 w-10 animate-pulse" />
      <p className="text-sm text-graphite-600">Loading Orbit…</p>
    </main>
  );
}
