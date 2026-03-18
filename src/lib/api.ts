"use client";

import type { CalendarEvent, RevisionItem } from "@/lib/types";

async function j<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function apiAddItem(item: Omit<RevisionItem, "id" | "uid">) {
  return j<{ id: string }>("/api/items", { method: "POST", body: JSON.stringify(item) });
}

export async function apiListDueItems(nowMs: number) {
  return j<{ items: RevisionItem[] }>(`/api/items?due=1&now=${encodeURIComponent(String(nowMs))}`);
}

export async function apiListItems() {
  return j<{ items: RevisionItem[] }>("/api/items");
}

export async function apiUpdateItem(id: string, patch: Partial<RevisionItem>) {
  return j<{ ok: true }>(`/api/items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}

export async function apiUpsertEvent(event: CalendarEvent) {
  return j<{ ok: true }>("/api/events", { method: "POST", body: JSON.stringify(event) });
}

export async function apiListEvents(fromDate: string, toDate: string) {
  return j<{ events: CalendarEvent[] }>(
    `/api/events?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`
  );
}

export async function apiSavePushSubscription(sub: PushSubscription) {
  return j<{ ok: true }>("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(sub)
  });
}

