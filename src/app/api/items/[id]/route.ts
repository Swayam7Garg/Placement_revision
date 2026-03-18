import { ObjectId } from "mongodb";
import { requireUid } from "@/app/api/_auth";
import { getDb } from "@/lib/mongo";
import type { RevisionItem } from "@/lib/types";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await requireUid();
  const { id } = await ctx.params;
  const patch = (await req.json()) as Partial<RevisionItem>;

  const db = await getDb();
  const itemsCol = db.collection("items");

  const _id = new ObjectId(id);
  const set: any = { updatedAt: Date.now() };
  if (typeof patch.nextRevisionAt === "number") set.nextRevisionAt = patch.nextRevisionAt;
  if (typeof patch.notes === "string") set.notes = patch.notes.slice(0, 10000);
  if (typeof patch.remindPush === "boolean") set.remindPush = patch.remindPush;
  if (typeof patch.important === "boolean") set.important = patch.important;

  const res = await itemsCol.updateOne({ _id, uid }, { $set: set });
  if (!res.matchedCount) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true as const });
}

