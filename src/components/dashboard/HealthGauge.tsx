import type { HealthScore } from "@/types/dashboard";

const LABEL_COLOR: Record<HealthScore["label"], string> = {
  strong: "#6FCF97",
  watch: "#E0A23D",
  "at risk": "#E0685B",
};

export function HealthGauge({ health }: { health: HealthScore }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - health.score / 100);
  const color = LABEL_COLOR[health.label];

  return (
    <div className="flex items-center gap-6">
      <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#2A2E35" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="64" y="60" textAnchor="middle" className="font-display" fill="#E9E5DA" fontSize="28">
          {health.score}
        </text>
        <text x="64" y="80" textAnchor="middle" fill="#3C424B" fontSize="11" className="uppercase tracking-wide">
          / 100
        </text>
      </svg>
      <div>
        <p className="font-display text-sm uppercase tracking-wide" style={{ color }}>
          {health.label}
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {health.signals.map((signal) => (
            <li key={signal} className="text-xs text-graphite-600">
              {signal}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
