import { Fragment } from "react";
import { formatWeekday } from "@/lib/format";
import { groupHours, parseSlots, slotText, todayName } from "@/lib/hours";
import type { Closure, OpeningDay } from "@/lib/types";

/** Weekly opening hours; today's row is highlighted (computed in the shop's time zone). */
export function HoursTable({ hours }: { hours: OpeningDay[] }) {
  const today = todayName();
  return (
    <table className="hours">
      <tbody>
        {hours.map((h) => (
          <tr key={h.day} className={h.day === today ? "is-today" : undefined}>
            <th>{h.day}</th>
            <td>{slotText(parseSlots(h.slots))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Footer summary: identical consecutive days are merged ("Lun. – Ven."). */
export function HoursSummary({ hours }: { hours: OpeningDay[] }) {
  return (
    <dl className="hours-mini">
      {groupHours(hours).map((g) => (
        <Fragment key={g.label}>
          <dt>{g.label}</dt>
          <dd>{g.text}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

export function ClosuresList({ closures }: { closures: Closure[] }) {
  return (
    <ul className="closures">
      {closures.map((c) => (
        <li key={c.id}>
          <b>Fermeture exceptionnelle</b>{" "}
          {!c.endDate || c.endDate === c.startDate
            ? `le ${formatWeekday(c.startDate)}`
            : `du ${formatWeekday(c.startDate)} au ${formatWeekday(c.endDate)}`}
          {c.reason ? ` — ${c.reason}` : ""}
        </li>
      ))}
    </ul>
  );
}
