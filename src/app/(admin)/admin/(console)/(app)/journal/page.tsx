import type { Metadata } from "next";
import { ActivityList } from "@/components/admin/parts";
import { requireAdmin } from "@/server/auth/session";
import { listActivity } from "@/server/repositories/activity";

export const metadata: Metadata = { title: "Journal d'activité" };

export default async function JournalPage() {
  await requireAdmin();
  return (
    <>
      <h1>Journal d&apos;activité</h1>
      <p className="muted">Les 500 dernières modifications faites depuis la console.</p>
      <section className="panel">
        <ActivityList entries={listActivity()} />
      </section>
    </>
  );
}
