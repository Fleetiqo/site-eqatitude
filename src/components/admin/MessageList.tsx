"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import type { ContactMessage } from "@/lib/types";
import { deleteMessage, markAllRead, setRead } from "@/server/actions/messages";
import { quoteFromMessage } from "@/server/actions/quotes";
import { useAdminUi } from "./AdminUi";

export function MessageList({ messages }: { messages: ContactMessage[] }) {
  const { run, confirm } = useAdminUi();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = messages.filter(
    (m) => !q || `${m.name} ${m.email} ${m.phone} ${m.subject} ${m.message}`.toLowerCase().includes(q),
  );

  return (
    <>
      <div className="head-row">
        <h1>Messages</h1>
        {messages.some((m) => !m.read) && (
          <button className="btn btn--ghost" onClick={() => run(markAllRead())}>
            Tout marquer comme lu
          </button>
        )}
      </div>
      <div className="filters">
        <input type="search" placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="messages">
        {rows.length ? (
          rows.map((m) => (
            <article key={m.id} className={m.read ? "panel pad msg" : "panel pad msg is-new"}>
              <header>
                <b>{m.name}</b> <span className="muted">{formatDateTime(m.createdAt)}</span>
              </header>
              {m.subject && <p className="msg__subject">{m.subject}</p>}
              <p className="pre">{m.message}</p>
              <p className="msg__contact">
                {m.phone && <a href={`tel:${m.phone.replace(/\s/g, "")}`}>📞 {m.phone}</a>}{" "}
                {m.email && (
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Votre message"}`)}`}>
                    ✉️ Répondre à {m.email}
                  </a>
                )}
              </p>
              <div className="actions">
                <button className="btn btn--ghost btn--sm" onClick={() => run(setRead(m.id, !m.read))}>
                  {m.read ? "Marquer non lu" : "Marquer comme lu"}
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={async () => {
                    const created = await run(quoteFromMessage(m.id));
                    if (created) router.push(`/admin/devis/${created.id}`);
                  }}
                >
                  Transformer en demande de devis
                </button>
                <button
                  className="btn btn--danger-ghost btn--sm"
                  onClick={async () => {
                    if (await confirm("Supprimer ce message ?")) await run(deleteMessage(m.id), "Message supprimé");
                  }}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="muted">Aucun message.</p>
        )}
      </div>
    </>
  );
}
