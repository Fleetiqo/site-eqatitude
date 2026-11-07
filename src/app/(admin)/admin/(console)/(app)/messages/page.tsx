import type { Metadata } from "next";
import { MessageList } from "@/components/admin/MessageList";
import { requireAdmin } from "@/server/auth/session";
import { loadMessages } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requireAdmin();
  return <MessageList messages={loadMessages()} />;
}
