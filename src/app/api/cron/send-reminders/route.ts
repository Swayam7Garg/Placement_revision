import webpush from "web-push";
import { getDb } from "@/lib/mongo";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contact = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!publicKey || !privateKey) return new Response("Missing VAPID keys", { status: 500 });

  webpush.setVapidDetails(contact, publicKey, privateKey);

  const db = await getDb();
  const now = Date.now();

  const dueItems = await db
    .collection("items")
    .find({ remindPush: true, nextRevisionAt: { $lte: now } })
    .project({ uid: 1, title: 1 })
    .limit(500)
    .toArray();

  const byUid = new Map<string, string[]>();
  for (const it of dueItems as any[]) {
    const arr = byUid.get(it.uid) || [];
    arr.push(it.title);
    byUid.set(it.uid, arr);
  }

  const subsCol = db.collection("pushSubs");
  let sent = 0;

  for (const [uid, titles] of byUid) {
    const subs = await subsCol.find({ uid }).limit(20).toArray();
    if (!subs.length) continue;

    const top = titles.slice(0, 3).join(", ");
    const body = titles.length <= 3 ? top : `${top} + ${titles.length - 3} more`;

    for (const s of subs as any[]) {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: s.keys
          },
          JSON.stringify({
            title: "Revision reminder",
            body,
            url: "/dashboard"
          })
        );
        sent++;
      } catch (e: any) {
        // Clean up expired subscriptions
        if (e?.statusCode === 410 || e?.statusCode === 404) {
          await subsCol.deleteOne({ _id: s._id });
        }
      }
    }
  }

  return Response.json({ ok: true as const, sent });
}

