"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Badge, Button, Card, Input, TextArea } from "@/components/ui";
import { useAuth } from "@/lib/client-auth";
import { apiAddItem, apiUpsertEvent } from "@/lib/api";
import type { Difficulty, ItemType, RevisionItem } from "@/lib/types";

const difficulties: Difficulty[] = ["Easy", "Medium", "Hard", "NA"];
const types: ItemType[] = ["Question", "Topic", "Note"];
const subjects = [
  "DSA",
  "DBMS",
  "CN",
  "OOPS",
  "System Design",
  "SQL",
  "Projects",
  "Aptitude",
  "Other"
];

function toDateInputValue(ms: number) {
  // datetime-local wants "yyyy-MM-ddTHH:mm"
  return format(new Date(ms), "yyyy-MM-dd'T'HH:mm");
}

function parseTags(raw: string) {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export default function AddPage() {
  const { user } = useAuth();
  const router = useRouter();

  const now = Date.now();
  const [subject, setSubject] = useState("DSA");
  const [customSubject, setCustomSubject] = useState("");
  const [type, setType] = useState<ItemType>("Question");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const tags = useMemo(() => parseTags(tagsRaw), [tagsRaw]);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [notes, setNotes] = useState("");
  const [revisionIntervalDays, setRevisionIntervalDays] = useState(7);
  const [nextRevisionAtStr, setNextRevisionAtStr] = useState(toDateInputValue(now + 24 * 60 * 60 * 1000));
  const [important, setImportant] = useState(false);
  const [remindPush, setRemindPush] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <RequireAuth>
      <AppShell>
        <div className="grid gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Add revision item</h1>
            <p className="text-base text-ink-100">
              Add LeetCode/GFG links or any subject topic. You'll see it in the dashboard when it's due.
            </p>
          </div>

          <Card className="p-5 grid gap-4">
            {err ? <div className="text-sm text-red-200">{err}</div> : null}

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="grid gap-1 text-base text-ink-100">
                <span>Subject</span>
                <select
                  className="h-11 rounded-2xl bg-bg-950/40 border border-border px-3 text-ink-50 focus:outline-none focus:ring-2 focus:ring-ink-500/40"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-base text-ink-100">
                <span>Type</span>
                <select
                  className="h-11 rounded-2xl bg-bg-950/40 border border-border px-3 text-ink-50 focus:outline-none focus:ring-2 focus:ring-ink-500/40"
                  value={type}
                  onChange={(e) => setType(e.target.value as ItemType)}
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {subject === "Other" ? (
              <Input
                label="Custom subject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g. OS, ML, DevOps"
              />
            ) : null}

            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Two Sum / OSI layers / Normalization notes" />
            <Input label="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://leetcode.com/... or https://..." />

            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Tags (comma separated)" value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="arrays, dp, sql, networking" />
              <label className="grid gap-1 text-base text-ink-100">
                <span>Difficulty</span>
                <select
                  className="h-11 rounded-2xl bg-bg-950/40 border border-border px-3 text-ink-50 focus:outline-none focus:ring-2 focus:ring-ink-500/40"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                >
                  {difficulties.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {tags.length ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            ) : null}

            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                label="Next revision date/time"
                type="datetime-local"
                value={nextRevisionAtStr}
                onChange={(e) => setNextRevisionAtStr(e.target.value)}
              />
              <Input
                label="Revision interval (days)"
                type="number"
                min={1}
                max={365}
                value={revisionIntervalDays}
                onChange={(e) => setRevisionIntervalDays(Number(e.target.value))}
              />
            </div>

            <TextArea label="Revision notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Your approach, edge cases, formulas, links..." />

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm text-ink-100">
                <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
                Mark important (shows in calendar)
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-100">
                <input type="checkbox" checked={remindPush} onChange={(e) => setRemindPush(e.target.checked)} />
                Allow push reminders
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button
                disabled={saving}
                onClick={async () => {
                  if (!user) return;
                  setErr(null);
                  if (!title.trim()) return setErr("Title is required.");
                  if (subject === "Other" && !customSubject.trim()) return setErr("Custom subject is required.");
                  const nextMs = Number.isFinite(Date.parse(nextRevisionAtStr))
                    ? new Date(nextRevisionAtStr).getTime()
                    : NaN;
                  if (!Number.isFinite(nextMs)) return setErr("Invalid next revision date/time.");
                  if (revisionIntervalDays < 1) return setErr("Interval must be at least 1 day.");
                  if (link && !/^https?:\/\//i.test(link)) return setErr("Link must start with http(s)://");

                  setSaving(true);
                  try {
                    const subjectValue = subject === "Other" ? customSubject : subject;
                    const base: Omit<RevisionItem, "id" | "uid"> = {
                      subject: subjectValue.trim() || "General",
                      type,
                      title: title.trim(),
                      link: link.trim() || undefined,
                      tags,
                      difficulty,
                      notes: notes.trim(),
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                      nextRevisionAt: nextMs,
                      revisionIntervalDays,
                      important,
                      remindPush
                    };
                    const { id } = await apiAddItem(base);

                    // Calendar: revision event on due date (day-level).
                    const day = format(new Date(nextMs), "yyyy-MM-dd");
                    const time = format(new Date(nextMs), "HH:mm");
                    await apiUpsertEvent({
                      id: `rev_${id}_${day}`,
                      uid: user.uid,
                      title: `Revise: ${base.title}`,
                      date: day,
                      time,
                      kind: "revision",
                      itemId: id,
                      link: base.link
                    });

                    if (important) {
                      await apiUpsertEvent({
                        id: `imp_${id}_${day}`,
                        uid: user.uid,
                        title: `Important: ${base.title}`,
                        date: day,
                        time,
                        kind: "important",
                        itemId: id,
                        link: base.link
                      });
                    }

                    router.push("/dashboard");
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : "Failed to save");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}

