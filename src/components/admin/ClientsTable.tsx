"use client";

import Link from "next/link";
import { useState } from "react";
import { euro, formatDateShort } from "@/lib/format";
import type { Client } from "@/server/queries/admin";
import { StatusPill } from "./parts";

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = clients.filter(
    (c) =>
      !q || `${c.lastName} ${c.firstName} ${c.organization} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(q),
  );
  return (
    <>
      <div className="filters">
        <input
          type="search"
          placeholder="Rechercher un client, une commune…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <section className="panel">
        {rows.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Commune</th>
                  <th>Devis</th>
                  <th>Accepté</th>
                  <th>Dernier contact</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.key}>
                    <td>
                      <b>
                        {c.firstName} {c.lastName}
                      </b>
                      {c.organization && (
                        <>
                          <br />
                          <small>{c.organization}</small>
                        </>
                      )}
                    </td>
                    <td>
                      {c.phone && (
                        <>
                          <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a>
                          <br />
                        </>
                      )}
                      {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
                    </td>
                    <td>{c.city}</td>
                    <td>
                      {c.quotes.length
                        ? c.quotes.map((d, i) => (
                            <span key={d.id}>
                              {i > 0 && <br />}
                              <Link href={`/admin/devis/${d.id}`} className="ref">
                                {d.ref}
                              </Link>{" "}
                              <StatusPill status={d.status} />
                            </span>
                          ))
                        : "—"}
                      {c.messages > 0 && (
                        <>
                          <br />
                          <small>{c.messages} message(s)</small>
                        </>
                      )}
                    </td>
                    <td>{c.acceptedAmount ? euro(c.acceptedAmount) : "—"}</td>
                    <td>{formatDateShort(c.lastContact)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted pad">Aucun client.</p>
        )}
      </section>
    </>
  );
}
