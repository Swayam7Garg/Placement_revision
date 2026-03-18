import { ObjectId } from "mongodb";
import { requireUid } from "@/app/api/_auth";
import { getDb } from "@/lib/mongo";
import type { RevisionItem } from "@/lib/types";

const MAX_ITEMS_PER_USER = 800;

export async function GET(req: Request) {
  const uid = await requireUid();
  const url = new URL(req.url);
  const due = url.searchParams.get("due") === "1";
  const now = Number(url.searchParams.get("now") || Date.now());

  const db = await getDb();
  const itemsCol = db.collection("items");

  const query: any = { uid };
  if (due) query.nextRevisionAt = { $lte: now };

  const items = await itemsCol
    .find(query)
    .sort({ nextRevisionAt: 1 })
    .limit(due ? 50 : 200)
    .toArray();

  const out: RevisionItem[] = items.map((d: any) => ({
    id: String(d._id),
    uid: d.uid,
    subject: d.subject,
    type: d.type,
    title: d.title,
    link: d.link || undefined,
    tags: d.tags || [],
    difficulty: d.difficulty,
    notes: d.notes || "",
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    nextRevisionAt: d.nextRevisionAt,
    revisionIntervalDays: d.revisionIntervalDays,
    important: Boolean(d.important),
    remindPush: Boolean(d.remindPush)
  }));

  return Response.json({ items: out });
}

export async function POST(req: Request) {
  const uid = await requireUid();
  const body = (await req.json()) as Omit<RevisionItem, "id" | "uid">;

  const db = await getDb();
  const itemsCol = db.collection("items");

  const count = await itemsCol.countDocuments({ uid });
  if (count >= MAX_ITEMS_PER_USER) {
    return new Response("Item limit reached for this user.", { status: 429 });
  }

  const now = Date.now();
  const doc = {
    uid,
    subject: String(body.subject || "General").slice(0, 40),
    type: body.type,
    title: String(body.title || "").slice(0, 140),
    link: body.link ? String(body.link).slice(0, 500) : null,
    tags: Array.isArray(body.tags) ? body.tags.map((t) => String(t).slice(0, 30)).slice(0, 12) : [],
    difficulty: body.difficulty,
    notes: String(body.notes || "").slice(0, 10000),
    createdAt: now,
    updatedAt: now,
    nextRevisionAt: Number(body.nextRevisionAt),
    revisionIntervalDays: Number(body.revisionIntervalDays || 7),
    important: Boolean(body.important),
    remindPush: Boolean(body.remindPush)
  };

  const res = await itemsCol.insertOne(doc);
  return Response.json({ id: String(res.insertedId) });
}

