"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Badge, Button, Card, Input, TextArea } from "@/components/ui";
import { useAuth } from "@/lib/client-auth";
import { apiListItems, apiSavePushSubscription, apiUpsertEvent, apiUpdateItem } from "@/lib/api";
import type { RevisionItem } from "@/lib/types";

function difficultyTone(d: RevisionItem["difficulty"]) {
  if (d === "Hard") return "red";
  if (d === "Medium") return "blue";
  if (d === "Easy") return "green";
  return "gray";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  async function refresh() {
    if (!user) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await apiListItems();
      setItems(res.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // push is handled by the service worker (`public/sw.js`)

  const filtered = useMemo(() => {
    const s = subjectFilter.trim().toLowerCase();
    const t = tagFilter.trim().toLowerCase();
    return items.filter((it) => {
      if (s && !it.subject.toLowerCase().includes(s)) return false;
      if (t && !it.tags.some((x) => x.toLowerCase().includes(t))) return false;
      return true;
    });
  }, [items, subjectFilter, tagFilter]);

  return (
    <RequireAuth>
      <AppShell>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">All revisions</h1>
              <p className="text-base text-ink-100">
                Press <span className="text-ink-50 font-medium">Revise</span> to open the link and schedule the next revision.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                onClick={async () => {
                  if (!user) return;
                  if (!("serviceWorker" in navigator)) {
                    window.alert("Service worker not supported in this browser.");
                    return;
                  }

                  const reg = await navigator.serviceWorker.register("/sw.js");
                  const perm = await Notification.requestPermission();
                  if (perm !== "granted") {
                    window.alert("Notification permission denied.");
                    return;
                  }

                  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                  if (!vapidKey) {
                    window.alert("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
                    return;
                  }

                  const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey)
                  });

                  await apiSavePushSubscription(sub);
                  window.alert("Push enabled on this device.");
                }}
              >
                Enable push
              </Button>
              <Link href="/add">
                <Button>Add item</Button>
              </Link>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Filter by subject" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} placeholder="DSA / DBMS / ..." />
            <Input label="Filter by tag" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="dp / sql / ..." />
          </div>

          {err ? <div className="text-sm text-red-200">{err}</div> : null}

          <div className="grid gap-3">
            {loading ? (
              <Card className="p-5 text-ink-100">Loading...</Card>
            ) : filtered.length === 0 ? (
              <Card className="p-5">
                <div className="text-ink-50 font-medium">No items yet.</div>
                <div className="mt-1 text-sm text-ink-100">Add something to start your revision plan.</div>
              </Card>
            ) : (
              filtered.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  uid={user!.uid}
                  onUpdated={async () => refresh()}
                />
              ))
            )}
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}

function ItemRow({
  item,
  uid,
  onUpdated
}: {
  item: RevisionItem;
  uid: string;
  onUpdated: () => Promise<void>;
}) {
  const [notes, setNotes] = useState(item.notes || "");
  const [saving, setSaving] = useState(false);
  const isOverdue = item.nextRevisionAt < Date.now();

  const dueText = format(new Date(item.nextRevisionAt), "dd MMM, HH:mm");

  return (
    <Card className="p-5 grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold">{item.title}</span>
            <Badge tone={difficultyTone(item.difficulty)}>{item.difficulty}</Badge>
            <Badge tone="gray">{item.subject}</Badge>
            <Badge tone="gray">{item.type}</Badge>
            {isOverdue ? <Badge tone="red">overdue</Badge> : null}
            {item.important ? <Badge tone="blue">important</Badge> : null}
          </div>
          <div className="text-xs text-ink-300">Due: {dueText}</div>
          {item.link ? (
            <a className="text-sm text-ink-300 hover:text-ink-100 underline underline-offset-4" href={item.link} target="_blank" rel="noreferrer">
              {item.link}
            </a>
          ) : null}
          {item.tags?.length ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              const nextMs = addDays(new Date(), item.revisionIntervalDays).getTime();
              const nextDay = format(new Date(nextMs), "yyyy-MM-dd");
              const nextTime = format(new Date(nextMs), "HH:mm");

              if (item.link) window.open(item.link, "_blank", "noopener,noreferrer");
              setSaving(true);
              try {
                await apiUpdateItem(item.id, { nextRevisionAt: nextMs });
                await apiUpsertEvent({
                  id: `rev_${item.id}_${nextDay}`,
                  uid: uid,
                  title: `Revise: ${item.title}`,
                  date: nextDay,
                  time: nextTime,
                  kind: "revision",
                  itemId: item.id,
                  link: item.link
                });
              } finally {
                setSaving(false);
              }

              await onUpdated();
            }}
          >
            {saving ? "Rescheduling..." : "Revise"}
          </Button>
        </div>
      </div>

      <TextArea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Your revision notes..."
      />
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={async () => {
            setSaving(true);
            try {
              await apiUpdateItem(item.id, { notes: notes.trim() });
            } finally {
              setSaving(false);
            }
            await onUpdated();
          }}
        >
          Save notes
        </Button>
      </div>
    </Card>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const outputArray = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) outputArray[i] = raw.charCodeAt(i);
  return outputArray;
}

