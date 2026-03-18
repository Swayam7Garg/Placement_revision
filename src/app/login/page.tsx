"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/client-auth";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const { user, loading, signInWithEmail } = useAuth();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("created") === "1") {
      setInfo("Account created. Please verify your email before signing in.");
    }
  }, []);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold">DSA + Placements Revision</h1>
        <p className="mt-2 text-base text-ink-100">
          Add questions/topics for any subject (DSA, DBMS, CN, OOPS, System Design…), schedule
          revisions, and get reminders.
        </p>
        {info ? <p className="mt-3 text-sm text-emerald-200">{info}</p> : null}
        {err ? <p className="mt-3 text-sm text-red-200">{err}</p> : null}
        <div className="mt-6 grid gap-3">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            disabled={submitting}
            onClick={async () => {
              setErr(null);
              setSubmitting(true);
              try {
                const res = await signInWithEmail(email, password);
                if ((res as any)?.error) throw new Error((res as any).error);
                router.replace("/dashboard");
              } catch (e) {
                setErr("Invalid email or password.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-sm text-ink-100">
            New here?{" "}
            <Link className="text-ink-300 hover:text-ink-100 underline underline-offset-4" href="/signup">
              Create an account
            </Link>
          </p>
          <p className="text-xs text-ink-300">
            Your data is private to your account (stored in MongoDB under your login).
          </p>
        </div>
      </Card>
    </div>
  );
}

