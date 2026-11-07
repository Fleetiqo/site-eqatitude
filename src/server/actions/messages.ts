"use server";

import { logActivity } from "../repositories/activity";
import { deleteMessage as remove, markAllMessagesRead, setMessageRead } from "../repositories/messages";
import { adminAction } from "./run";

export async function setRead(id: string, read: boolean) {
  return adminAction(() => {
    setMessageRead(id, read);
    return null;
  });
}

export async function markAllRead() {
  return adminAction(() => {
    markAllMessagesRead();
    return null;
  });
}

export async function deleteMessage(id: string) {
  return adminAction(() => {
    remove(id);
    logActivity("Suppression — message");
    return null;
  });
}
