import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "@/lib/mongo";
import { getEmailFrom, getEmailTransport } from "@/lib/email";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) return new Response("Missing email/password", { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response("Email must contain @ and a domain.", { status: 400 });

  // Password rules: 8-64 chars, at least 1 letter + 1 number.
  // (Optionally you can tighten this to require a special char too.)
  if (password.length < 8 || password.length > 64) {
    return new Response("Password must be 8-64 characters.", { status: 400 });
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return new Response("Password must include at least 1 letter and 1 number.", { status: 400 });
  }

  const db = await getDb();
  const col = db.collection<any>("users");

  const existing = await col.findOne({ email });
  if (existing) return new Response("Email already exists", { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  // Use a random token, store only its hash for security.
  const verifyToken = crypto.randomBytes(32).toString("base64url");
  const verifyTokenHash = sha256(verifyToken);
  const verifyTokenExpiresAt = Date.now() + 1000 * 60 * 60 * 24;

  const res = await col.insertOne({
    email,
    passwordHash,
    emailVerifiedAt: null,
    verifyTokenHash,
    verifyTokenExpiresAt,
    createdAt: Date.now()
  });

  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    await col.deleteOne({ _id: res.insertedId });
    return new Response("Missing env: NEXTAUTH_URL", { status: 500 });
  }

  // Build a clickable verification link for the email.
  const verifyUrl = `${baseUrl.replace(/\/$/, "")}/verify?token=${verifyToken}`;
  const transporter = getEmailTransport();

  try {
    await transporter.sendMail({
      from: getEmailFrom(),
      to: email,
      subject: "Verify your email",
      text: `Welcome! Verify your email using this link: ${verifyUrl}`,
      html: `
        <p>Welcome! Please verify your email address.</p>
        <p><a href="${verifyUrl}">Click here to verify your email</a></p>
        <p>If the link does not work, paste this in your browser:</p>
        <p>${verifyUrl}</p>
      `
    });
  } catch (err) {
    await col.deleteOne({ _id: res.insertedId });
    return new Response("Failed to send verification email", { status: 500 });
  }

  return Response.json({ ok: true as const });
}

