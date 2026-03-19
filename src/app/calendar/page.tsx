"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek
} from "date-fns";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Badge, Button, Card, Input, cn } from "@/components/ui";
import { apiListEvents, apiListItems, apiUpsertEvent } from "@/lib/api";
import { useAuth } from "@/lib/client-auth";
import type { CalendarEvent, RevisionItem } from "@/lib/types";

const UPCOMING_DAYS = 7;

export default function CalendarPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [cursorMonth, setCursorMonth] = useState(() => startOfMonth(new Date()));
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventTime, setEventTime] = useState(format(new Date(), "HH:mm"));
  const [eventKind, setEventKind] = useState<CalendarEvent["kind"]>("important");
  const [eventLink, setEventLink] = useState("");

  const range = useMemo(() => {
    const from = startOfWeek(startOfMonth(cursorMonth), { weekStartsOn: 1 });
    const to = endOfWeek(endOfMonth(cursorMonth), { weekStartsOn: 1 });
    return { from, to };
  }, [cursorMonth]);

  useEffect(() => {
    if (!user) return;
    setErr(null);
    setLoading(true);
    void (async () => {
      try {
        const [itemRes, eventRes] = await Promise.all([
          apiListItems(),
          apiListEvents(format(range.from, "yyyy-MM-dd"), format(range.to, "yyyy-MM-dd"))
        ]);
        setItems(itemRes.items);
        setEvents(eventRes.events);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load calendar");
      } finally {
        setLoading(false);
      }
    })();
  }, [range.from, range.to]);

  const nowMs = Date.now();
  const upcomingMs = addDays(new Date(), UPCOMING_DAYS).getTime();

  const pending = useMemo(
    () => items.filter((it) => it.nextRevisionAt < nowMs).sort((a, b) => a.nextRevisionAt - b.nextRevisionAt),
    [items, nowMs]
  );

  const upcoming = useMemo(
    () => items.filter((it) => it.nextRevisionAt >= nowMs && it.nextRevisionAt <= upcomingMs).sort((a, b) => a.nextRevisionAt - b.nextRevisionAt),
    [items, nowMs, upcomingMs]
  );

  const byDateRevisions = useMemo(() => {
    const m = new Map<string, RevisionItem[]>();
    for (const it of items) {
      const key = format(new Date(it.nextRevisionAt), "yyyy-MM-dd");
      const arr = m.get(key) || [];
      arr.push(it);
      m.set(key, arr);
    }
    return m;
  }, [items]);

  const byDateEvents = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (e.kind === "revision") continue;
      const arr = m.get(e.date) || [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return m;
  }, [events]);

  const days = useMemo(() => {
    const out: Date[] = [];
    for (let d = range.from; d <= range.to; d = addDays(d, 1)) out.push(d);
    return out;
  }, [range.from, range.to]);

  const interviews = events.filter((e) => e.kind === "interview").sort(sortByDateTime);
  const schedules = events.filter((e) => e.kind === "schedule").sort(sortByDateTime);
  const importants = events.filter((e) => e.kind === "important").sort(sortByDateTime);

  return (
    <RequireAuth>
      <AppShell>
        <div className="grid gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Revision calendar</h1>
            <p className="text-base text-ink-100">
              Pending and upcoming revisions, interviews, schedules, and important dates in one view.
            </p>
          </div>

          {err ? <div className="text-sm text-red-200">{err}</div> : null}

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="p-5 grid gap-2">
              <div className="text-sm text-ink-300">Pending revisions</div>
              <div className="text-2xl font-semibold text-ink-50">{pending.length}</div>
              <div className="text-sm text-ink-100">Overdue items need attention.</div>
            </Card>
            <Card className="p-5 grid gap-2">
              <div className="text-sm text-ink-300">Upcoming ({UPCOMING_DAYS} days)</div>
              <div className="text-2xl font-semibold text-ink-50">{upcoming.length}</div>
              <div className="text-sm text-ink-100">Plan your next revision block.</div>
            </Card>
            <Card className="p-5 grid gap-2">
              <div className="text-sm text-ink-300">Scheduled interviews</div>
              <div className="text-2xl font-semibold text-ink-50">{interviews.length}</div>
              <div className="text-sm text-ink-100">Keep interviews visible.</div>
            </Card>
          </div>

          <Card className="p-5 grid gap-4">
            <div className="grid gap-3">
              <div className="grid lg:grid-cols-2 gap-3">
                <Input label="Title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Interview / OA / deadline" />
                <Input label="Link (optional)" value={eventLink} onChange={(e) => setEventLink(e.target.value)} placeholder="https://..." />
              </div>
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <Input label="Date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                <Input label="Time" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                <label className="grid gap-1 text-base text-ink-100">
                  <span>Kind</span>
                  <select
                    className="h-11 rounded-2xl bg-white border border-border px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink-500/40"
                    value={eventKind}
                    onChange={(e) => setEventKind(e.target.value as CalendarEvent["kind"])}
                  >
                    <option value="important" className="bg-white text-slate-900">Important</option>
                    <option value="interview" className="bg-white text-slate-900">Interview</option>
                    <option value="schedule" className="bg-white text-slate-900">Schedule</option>
                  </select>
                </label>
              </div>
              <div>
                <Button
                  onClick={async () => {
                    setErr(null);
                    if (!user) return setErr("Sign in required.");
                    if (!eventTitle.trim()) return setErr("Title is required.");
                    if (!eventDate) return setErr("Date is required.");
                    if (eventLink && !/^https?:\/\//i.test(eventLink)) return setErr("Link must start with http(s)://");

                    const id = `${eventKind}_${eventDate}_${eventTitle.trim().slice(0, 24).replace(/\s+/g, "_")}`;
                    const timeValue = eventTime?.trim() ? eventTime : undefined;

                    await apiUpsertEvent({
                      id,
                      uid: user.uid,
                      title: eventTitle.trim(),
                      date: eventDate,
                      time: timeValue,
                      kind: eventKind,
                      link: eventLink.trim() || undefined
                    });

                    setEvents((prev) => {
                      const next = prev.filter((x) => x.id !== id);
                      next.push({
                        id,
                        uid: user.uid,
                        title: eventTitle.trim(),
                        date: eventDate,
                        time: timeValue,
                        kind: eventKind,
                        link: eventLink.trim() || undefined
                      });
                      return next;
                    });

                    setEventTitle("");
                    setEventLink("");
                  }}
                >
                  Add event
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-[2fr,1fr] gap-4">
            <Card className="p-5 grid gap-3">
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" onClick={() => setCursorMonth((m) => addMonths(m, -1))}>
                  Prev
                </Button>
                <div className="text-base text-ink-100">
                  <span className="text-ink-50 font-medium">{format(cursorMonth, "MMMM yyyy")}</span>
                  {loading ? <span className="ml-2 text-ink-300">(loading)</span> : null}
                </div>
                <Button variant="ghost" onClick={() => setCursorMonth((m) => addMonths(m, 1))}>
                  Next
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-sm text-ink-300">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="px-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {days.map((d) => {
                  const dayKey = format(d, "yyyy-MM-dd");
                  const isInMonth = d.getMonth() === cursorMonth.getMonth();
                  const dayItems = byDateRevisions.get(dayKey) || [];
                  const dayEvents = byDateEvents.get(dayKey) || [];

                  const entries = [
                    ...dayItems.map((it) => ({
                      id: it.id,
                      label: `Revise: ${it.title}`,
                      time: format(new Date(it.nextRevisionAt), "HH:mm"),
                      link: it.link,
                      tone: it.nextRevisionAt < nowMs ? "red" : "blue"
                    })),
                    ...dayEvents.map((e) => ({
                      id: e.id,
                      label: e.title,
                      time: e.time || "",
                      link: e.link,
                      tone: e.kind === "interview" ? "green" : e.kind === "schedule" ? "blue" : "gray"
                    }))
                  ].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

                  const visible = entries.slice(0, 4);
                  const extra = entries.length - visible.length;

                  return (
                    <div
                      key={dayKey}
                      className={cn(
                        "min-h-28 rounded-2xl border border-border bg-bg-950/30 p-2 overflow-hidden",
                        !isInMonth && "opacity-50"
                      )}
                    >
                      <div className="text-xs text-ink-300">{format(d, "d")}</div>
                      <div className="mt-2 grid gap-1">
                        {visible.map((e) => (
                          <button
                            key={e.id}
                            className={cn(
                              "text-left rounded-lg border px-2 py-1 text-xs hover:bg-bg-800 max-w-full min-w-0",
                              e.tone === "red"
                                ? "border-red-500/40 bg-red-500/10 text-red-100"
                                : e.tone === "green"
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                                  : e.tone === "blue"
                                    ? "border-ink-500/40 bg-ink-500/10 text-ink-100"
                                    : "border-white/10 bg-white/5 text-ink-100"
                            )}
                            onClick={() => {
                              if (e.link) window.open(e.link, "_blank", "noopener,noreferrer");
                            }}
                            title={e.label}
                          >
                            <div className="truncate">
                              {e.time ? `${e.time} ` : ""}{e.label}
                            </div>
                          </button>
                        ))}
                        {extra > 0 ? <Badge tone="gray">+{extra} more</Badge> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="grid gap-4">
              <Card className="p-5 grid gap-3">
                <div className="text-base font-semibold text-ink-50">Pending revisions</div>
                {pending.length === 0 ? (
                  <div className="text-sm text-ink-100">No pending revisions.</div>
                ) : (
                  pending.slice(0, 6).map((it) => (
                    <div key={it.id} className="text-sm text-ink-100">
                      {format(new Date(it.nextRevisionAt), "dd MMM, HH:mm")} - {it.title}
                    </div>
                  ))
                )}
              </Card>

              <Card className="p-5 grid gap-3">
                <div className="text-base font-semibold text-ink-50">Upcoming revisions</div>
                {upcoming.length === 0 ? (
                  <div className="text-sm text-ink-100">No upcoming revisions.</div>
                ) : (
                  upcoming.slice(0, 6).map((it) => (
                    <div key={it.id} className="text-sm text-ink-100">
                      {format(new Date(it.nextRevisionAt), "dd MMM, HH:mm")} - {it.title}
                    </div>
                  ))
                )}
              </Card>

              <Card className="p-5 grid gap-3">
                <div className="text-base font-semibold text-ink-50">Interviews</div>
                {interviews.length === 0 ? (
                  <div className="text-sm text-ink-100">No interviews scheduled.</div>
                ) : (
                  interviews.slice(0, 6).map((e) => (
                    <div key={e.id} className="text-sm text-ink-100">
                      {formatEventDate(e)} - {e.title}
                    </div>
                  ))
                )}
              </Card>

              <Card className="p-5 grid gap-3">
                <div className="text-base font-semibold text-ink-50">Schedules</div>
                {schedules.length === 0 ? (
                  <div className="text-sm text-ink-100">No schedules yet.</div>
                ) : (
                  schedules.slice(0, 6).map((e) => (
                    <div key={e.id} className="text-sm text-ink-100">
                      {formatEventDate(e)} - {e.title}
                    </div>
                  ))
                )}
              </Card>

              <Card className="p-5 grid gap-3">
                <div className="text-base font-semibold text-ink-50">Important dates</div>
                {importants.length === 0 ? (
                  <div className="text-sm text-ink-100">No important dates yet.</div>
                ) : (
                  importants.slice(0, 6).map((e) => (
                    <div key={e.id} className="text-sm text-ink-100">
                      {formatEventDate(e)} - {e.title}
                    </div>
                  ))
                )}
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}

function sortByDateTime(a: CalendarEvent, b: CalendarEvent) {
  const aKey = `${a.date}T${a.time || "99:99"}`;
  const bKey = `${b.date}T${b.time || "99:99"}`;
  return aKey.localeCompare(bKey);
}

function formatEventDate(e: CalendarEvent) {
  const base = new Date(`${e.date}T${e.time || "00:00"}`);
  return format(base, e.time ? "dd MMM, HH:mm" : "dd MMM");
}

