"use client";

import { useEffect, useState } from "react";
import { openStatus, type OpenStatus as Status } from "@/lib/hours";
import type { Closure, OpeningDay } from "@/lib/types";

function StatusText({ status }: { status: Status }) {
  switch (status.kind) {
    case "open":
      return (
        <>
          <b className="is-open">Ouvert</b> jusqu&apos;à {status.until}
        </>
      );
    case "closed-opens-today":
      return (
        <>
          <b>Fermé</b> · ouvre à {status.at}
        </>
      );
    case "closed-opens-later":
      return (
        <>
          <b>Fermé</b> · ouvre {status.when} à {status.at}
        </>
      );
    case "exceptional-closure":
      return (
        <>
          <b>Fermé exceptionnellement</b>
          {status.reason ? ` · ${status.reason}` : ""}
        </>
      );
    default:
      return <>Horaires d&apos;ouverture</>;
  }
}

/**
 * Live "Ouvert jusqu'à 19h" indicator. Computed in the browser (after hydration) and
 * refreshed every minute so a page left open stays correct.
 */
export function OpenStatus({ hours, closures }: { hours: OpeningDay[]; closures: Closure[] }) {
  const [status, setStatus] = useState<Status>({ kind: "unknown" });
  useEffect(() => {
    const update = () => setStatus(openStatus(hours, closures));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [hours, closures]);

  return (
    <span className="topbar__status">
      <StatusText status={status} />
    </span>
  );
}
