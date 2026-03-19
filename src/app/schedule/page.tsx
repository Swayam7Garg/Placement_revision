"use client";

import { useEffect, useMemo, useState } from "react";
import { endOfDay, format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Badge, Button, Card, Input } from "@/components/ui";
import { apiListItems } from "@/lib/api";
import type { RevisionItem } from "@/lib/types";

const STORAGE_KEY = "dailySchedule.v1";

type DailyTodo = {
  id: string;
  text: string;
  done: boolean;
};

type StoredDailySchedule = {
  date: string; // yyyy-MM-dd
  todos: DailyTodo[];
};

function loadDailySchedule(todayKey: string): StoredDailySchedule {
  if (typeof window === "undefined") return { date: todayKey, todos: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayKey, todos: [] };
    const parsed = JSON.parse(raw) as StoredDailySchedule;
    if (parsed.date !== todayKey) return { date: todayKey, todos: [] };
    return parsed;
  } catch {
    return { date: todayKey, todos: [] };
  }
}

function saveDailySchedule(state: StoredDailySchedule) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function SchedulePage() {
  const [currentDateKey, setCurrentDateKey] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [todos, setTodos] = useState<DailyTodo[]>([]);
  const [todoText, setTodoText] = useState("");
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const state = loadDailySchedule(currentDateKey);
    setTodos(state.todos);
  }, [currentDateKey]);

  useEffect(() => {
    saveDailySchedule({ date: currentDateKey, todos });
  }, [currentDateKey, todos]);

  useEffect(() => {
    let timer: number | undefined;
    const checkDayChange = () => {
      const nowKey = format(new Date(), "yyyy-MM-dd");
      if (nowKey !== currentDateKey) {
        setCurrentDateKey(nowKey);
        setTodos([]);
      }
    };
    timer = window.setInterval(checkDayChange, 60_000);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [currentDateKey]);

  useEffect(() => {
    setErr(null);
    setLoading(true);
    void (async () => {
      try {
        const res = await apiListItems();
        setItems(res.items);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load revisions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dueToday = useMemo(() => {
    const end = endOfDay(new Date()).getTime();
    return items
      .filter((it) => it.nextRevisionAt <= end)
      .sort((a, b) => a.nextRevisionAt - b.nextRevisionAt)
      .slice(0, 12);
  }, [items]);

  const completedCount = todos.filter((t) => t.done).length;

  return (
    <RequireAuth>
      <AppShell>
        <div className="grid gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Daily schedule</h1>
            <p className="text-base text-ink-100">
              Your daily list resets every day. Add tasks or pull in revisions that are already assigned.
            </p>
          </div>

          <Card className="p-5 grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-ink-300">{currentDateKey}</div>
              <div className="text-sm text-ink-100">
                {completedCount}/{todos.length} done
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                label="Add a task"
                value={todoText}
                onChange={(e) => setTodoText(e.target.value)}
                placeholder="Solve 2 graphs questions, review CN notes"
              />
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    const text = todoText.trim();
                    if (!text) return;
                    setTodos((prev) => [
                      { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, text, done: false },
                      ...prev
                    ]);
                    setTodoText("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            {todos.length === 0 ? (
              <div className="text-sm text-ink-100">No tasks yet. Add a few to get started.</div>
            ) : (
              <div className="grid gap-2">
                {todos.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-bg-950/30 px-3 py-2"
                  >
                    <label className="flex items-center gap-2 text-sm text-ink-50">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setTodos((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: checked } : x)));
                        }}
                      />
                      <span className={t.done ? "line-through text-ink-300" : ""}>{t.text}</span>
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTodos((prev) => prev.filter((x) => x.id !== t.id))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-ink-50">Earlier assigned revisions</div>
                <div className="text-sm text-ink-100">Quick-add revisions that are due today or overdue.</div>
              </div>
              <Badge tone="gray">{loading ? "Loading" : `${dueToday.length} items`}</Badge>
            </div>

            {err ? <div className="text-sm text-red-200">{err}</div> : null}

            {loading ? (
              <div className="text-sm text-ink-100">Loading revisions...</div>
            ) : dueToday.length === 0 ? (
              <div className="text-sm text-ink-100">No due revisions for today.</div>
            ) : (
              <div className="grid gap-2">
                {dueToday.map((it) => (
                  <div
                    key={it.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-bg-950/30 px-3 py-2"
                  >
                    <div className="grid gap-1">
                      <div className="text-sm font-semibold text-ink-50">{it.title}</div>
                      <div className="text-xs text-ink-300">{it.subject}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const text = `Revise: ${it.title}`;
                        setTodos((prev) => [
                          { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, text, done: false },
                          ...prev
                        ]);
                      }}
                    >
                      Add to list
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
