"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-xl">Something went wrong</h1>
      <p className="max-w-sm text-sm text-graphite-600">{error.message}</p>
      <button onClick={reset} className="text-sm text-signal-amber hover:underline">
        Try again
      </button>
    </main>
  );
}
