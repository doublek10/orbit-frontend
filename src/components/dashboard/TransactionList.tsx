import type { LedgerTransaction } from "@/types/dashboard";
import { formatMoney, formatDateTime } from "@/core/utils/format";

export function TransactionList({ transactions }: { transactions: LedgerTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-graphite-600">
        No transactions yet - connect a provider to bring in real activity.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-graphite-700">
      {transactions.map((tx) => {
        const isInflow = tx.direction === "inflow";
        return (
          <li key={tx.id} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                  isInflow ? "bg-signal-green/15 text-signal-green" : "bg-signal-red/15 text-signal-red"
                }`}
                aria-hidden
              >
                {isInflow ? "↓" : "↑"}
              </span>
              <div>
                <p className="text-sm text-paper">{tx.description || tx.counterparty || "Transaction"}</p>
                <p className="font-mono text-xs text-graphite-600">
                  {tx.category} · {formatDateTime(tx.occurred_at)}
                  {tx.is_anomaly && (
                    <span className="ml-2 rounded bg-signal-amber/15 px-1.5 py-0.5 text-signal-amber">
                      flagged
                    </span>
                  )}
                </p>
              </div>
            </div>
            <span
              className={`font-mono text-sm ${isInflow ? "text-signal-green" : "text-signal-red"}`}
            >
              {isInflow ? "+" : "-"}
              {formatMoney(tx.amount, tx.currency)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
