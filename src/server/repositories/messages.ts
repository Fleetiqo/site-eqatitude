import { desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { messages } from "../db/schema";
import { newId } from "../ids";
import type { ContactMessage } from "@/lib/types";

export const listMessages = (): ContactMessage[] =>
  getDb().select().from(messages).orderBy(desc(messages.createdAt)).all();

export function createMessage(data: Omit<ContactMessage, "id" | "createdAt" | "read">): ContactMessage {
  const row = { ...data, id: newId(), createdAt: new Date().toISOString(), read: false };
  getDb().insert(messages).values(row).run();
  return row;
}

export const getMessage = (id: string): ContactMessage | undefined =>
  getDb().select().from(messages).where(eq(messages.id, id)).get();

export const setMessageRead = (id: string, read: boolean): void =>
  void getDb().update(messages).set({ read }).where(eq(messages.id, id)).run();

export const markAllMessagesRead = (): void =>
  void getDb().update(messages).set({ read: true }).where(eq(messages.read, false)).run();

export const deleteMessage = (id: string): void => void getDb().delete(messages).where(eq(messages.id, id)).run();
