import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth";

export async function requireUid() {
  const session = await getServerSession(authOptions);
  const uid = (session as any)?.uid as string | undefined;
  if (!uid) throw new Response("Unauthorized", { status: 401 });
  return uid;
}

