import { requireUid } from "@/app/api/_auth";
import { getDb } from "@/lib/mongo";
import type { CalendarEvent } from "@/lib/types";

export async function GET(req: Request) {
  const uid = await requireUid();
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) return new Response("Missing from/to", { status: 400 });

  const db = await getDb();
  const col = db.collection<any>("events");

  const events = await col
    .find({ uid, date: { $gte: from, $lte: to } })
    .sort({ date: 1 })
    .limit(800)
    .toArray();

  const out: CalendarEvent[] = events.map((d: any) => ({
    id: String(d._id),
    uid: d.uid,
    title: d.title,
    date: d.date,
    time: d.time || undefined,
    kind: d.kind,
    itemId: d.itemId || undefined,
    link: d.link || undefined
  }));

  return Response.json({ events: out });
}

export async function POST(req: Request) {
  const uid = await requireUid();
  const body = (await req.json()) as CalendarEvent;

  const db = await getDb();
  const col = db.collection<any>("events");

  const id = body.id || `${body.kind}_${body.date}_${body.title}`.slice(0, 120);
  await col.updateOne(
    { _id: id, uid },
    {
      $set: {
        uid,
        title: String(body.title || "").slice(0, 160),
        date: String(body.date),
        time: body.time ? String(body.time).slice(0, 5) : null,
        kind: body.kind,
        itemId: body.itemId || null,
        link: body.link || null
      }
    },
    { upsert: true }
  );

  return Response.json({ ok: true as const });
}

