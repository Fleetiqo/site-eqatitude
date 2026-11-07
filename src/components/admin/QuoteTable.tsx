"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { euro, formatDateShort } from "@/lib/format";
import { projectTypeShortLabel, type QuoteStatus } from "@/lib/quotes/definitions";
import { StatusPill } from "./parts";

export interface QuoteRow {
  id: string;
  ref: string;
  createdAt: string;
  name: string;
  organization: string;
  phone: string;
  email: string;
  city: string;
  types: string[];
  total: number | null;
  reminderDate: string;
  due: boolean;
  status: QuoteStatus;
}

export function QuoteTable({ rows }: { rows: QuoteRow[] }) {
  const router = useRouter();
  return (
    <div className="table-wrap">
      <table className="table table--click">
        <thead>
          <tr>
            <th>Réf.</th>
            <th>Date</th>
            <th>Client</th>
            <th>Commune</th>
            <th>Projet</th>
            <th>Montant</th>
            <th>Relance</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr
              key={d.id}
              className={d.status === "nouveau" ? "is-new" : undefined}
              onClick={() => router.push(`/admin/devis/${d.id}`)}
            >
              <td>
                <Link href={`/admin/devis/${d.id}`} onClick={(e) => e.stopPropagation()}>
                  <b>{d.ref}</b>
                </Link>
              </td>
              <td>{formatDateShort(d.createdAt)}</td>
              <td>
                {d.name}
                {d.organization && (
                  <>
                    <br />
                    <small>{d.organization}</small>
                  </>
                )}
              </td>
              <td>{d.city}</td>
              <td>{d.types.map(projectTypeShortLabel).join(", ")}</td>
              <td>{d.total !== null ? euro(d.total) : <span className="muted">—</span>}</td>
              <td>
                {d.reminderDate && <span className={d.due ? "due" : undefined}>{formatDateShort(d.reminderDate)}</span>}
              </td>
              <td>
                <StatusPill status={d.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
