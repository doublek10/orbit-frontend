/**
 * The one visual signature this app is built around: a small instrument
 * mark of concentric, slightly eccentric orbit rings with a single node -
 * standing in for "one identity, resolved through concentric layers of
 * trust" (Supabase -> Gateway -> Kernel). Used sparingly - only on
 * auth/entry screens, never as decoration elsewhere.
 */
export function OrbitMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" stroke="#2A2E35" strokeWidth="1" />
      <ellipse cx="32" cy="32" rx="24" ry="14" stroke="#3C424B" strokeWidth="1" transform="rotate(-18 32 32)" />
      <ellipse cx="32" cy="32" rx="17" ry="9" stroke="#E0A23D" strokeWidth="1.25" transform="rotate(24 32 32)" />
      <circle cx="32" cy="32" r="2.5" fill="#E0A23D" />
      <circle cx="46.5" cy="26" r="2" fill="#E9E5DA" />
    </svg>
  );
}
