import crypto from "crypto";
import { getDb } from "@/lib/mongo";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = String(url.searchParams.get("token") || "");
  if (!token) return new Response("Missing token", { status: 400 });

  const tokenHash = sha256(token);
  const db = await getDb();
  const col = db.collection<any>("users");

  const now = Date.now();
  const user = await col.findOne({
    verifyTokenHash: tokenHash,
    verifyTokenExpiresAt: { $gt: now }
  });

  if (!user) return new Response("Invalid or expired token", { status: 400 });

  // Mark verified and remove token fields to prevent reuse.
  await col.updateOne(
    { _id: user._id },
    {
      $set: { emailVerifiedAt: now },
      $unset: { verifyTokenHash: "", verifyTokenExpiresAt: "" }
    }
  );

  return Response.json({ ok: true as const });
}
