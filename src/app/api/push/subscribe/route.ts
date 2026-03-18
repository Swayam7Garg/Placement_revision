import { requireUid } from "@/app/api/_auth";
import { getDb } from "@/lib/mongo";

export async function POST(req: Request) {
  const uid = await requireUid();
  const sub = await req.json();

  // Basic shape check
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return new Response("Invalid subscription", { status: 400 });
  }

  const db = await getDb();
  const col = db.collection<any>("pushSubs");
  const id = String(sub.endpoint).slice(0, 600);

  await col.updateOne(
    { _id: id, uid },
    {
      $set: {
        uid,
        endpoint: sub.endpoint,
        keys: sub.keys,
        updatedAt: Date.now()
      }
    },
    { upsert: true }
  );

  return Response.json({ ok: true as const });
}

