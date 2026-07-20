"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { OrbitMark } from "@/components/shared/OrbitMark";

export function AuthGate({ title, children }: { title: string; children?: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <OrbitMark className="h-8 w-8 animate-pulse" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/overview" className="text-xs text-graphite-600 hover:text-signal-amber">
        ← Overview
      </Link>
      <h1 className="mb-6 mt-2 font-display text-2xl">{title}</h1>
      {children}
    </main>
  );
}
