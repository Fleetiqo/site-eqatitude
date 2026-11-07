import { formatDateTime } from "@/lib/format";
import { QUOTE_STATUSES, type QuoteStatus } from "@/lib/quotes/definitions";
import type { ActivityEntry } from "@/lib/types";

export const StatusPill = ({ status }: { status: QuoteStatus }) => (
  <span className={`pill pill--${status}`}>{QUOTE_STATUSES[status] ?? status}</span>
);

export function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  if (!entries.length) return <p className="muted pad">Rien pour le moment.</p>;
  return (
    <ul className="timeline pad">
      {entries.map((a, i) => (
        <li key={i}>
          <time>{formatDateTime(a.at)}</time>
          {a.text}
        </li>
      ))}
    </ul>
  );
}
