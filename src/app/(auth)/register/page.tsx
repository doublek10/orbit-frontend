"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { OrbitMark } from "@/components/shared/OrbitMark";
import { countryService } from "@/core/services/country.service";
import type { Country } from "@/types/country";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The country picker is built from the Kernel's Country Package
  // registry, never hardcoded here - only an `active` package (one
  // that's actually been built out) is selectable. Others still show,
  // as "coming soon", so people can see what's next.
  useEffect(() => {
    countryService
      .list()
      .then((list) => {
        setCountries(list);
        const firstActive = list.find((c) => c.active);
        if (firstActive) setCountry(firstActive.code);
      })
      .catch(() => {
        // If the Kernel can't be reached the form still renders - the
        // submit will simply fail with a clear error, same as any
        // other Kernel outage.
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Page -> AuthContext -> auth.service -> gateway.ts -> Gateway
      // -> Kernel. The Kernel is the one that talks to Supabase (gets a
      // UUID back) and then writes the company + owner rows to Postgres,
      // as a single atomic step. On success the Kernel signs the user in
      // immediately, so a successful signup lands straight in the app -
      // no separate login step.
      await signUp(email, password, companyName, country);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <OrbitMark className="h-12 w-12" />
          <h1 className="font-display text-xl tracking-tight">Create your Orbit account</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="companyName" className="mb-1 block text-xs text-graphite-600">
              Company name
            </label>
            <Input
              id="companyName"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="country" className="mb-1 block text-xs text-graphite-600">
              Country
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              className="w-full rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2 text-sm text-paper focus:border-signal-amber"
            >
              {countries.length === 0 && <option value="">Loading countries…</option>}
              {countries.map((c) => (
                <option key={c.code} value={c.code} disabled={!c.active}>
                  {c.name}
                  {!c.active ? " (coming soon)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs text-graphite-600">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs text-graphite-600">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-signal-red">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting || !country} className="w-full">
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-graphite-600">
          Already have an account?{" "}
          <Link href="/login" className="text-signal-amber hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
