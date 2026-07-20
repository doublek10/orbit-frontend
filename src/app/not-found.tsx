import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-xl">Page not found</h1>
      <Link href="/" className="text-sm text-signal-amber hover:underline">
        Back to Orbit
      </Link>
    </main>
  );
}
