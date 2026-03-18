"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function validate() {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Email must contain @ and a domain.";
    if (password.length < 8 || password.length > 64) return "Password must be 8-64 characters.";
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
      return "Password must include at least 1 letter and 1 number.";
    return null;
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <Card className="w-full max-w-md p-6 grid gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="mt-1 text-base text-ink-100">Email + password (free).</p>
        </div>

        {err ? <p className="text-sm text-red-200">{err}</p> : null}
        {info ? <p className="text-sm text-emerald-200">{info}</p> : null}

        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Password (8-64 chars, letters + numbers)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          disabled={loading}
          onClick={async () => {
            setErr(null);
            setInfo(null);
            const v = validate();
            if (v) return setErr(v);
            setLoading(true);
            try {
              const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
              });
              if (!res.ok) throw new Error(await res.text());
              setInfo("Check your email to verify your account.");
              setEmail("");
              setPassword("");
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Signup failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Creating…" : "Create"}
        </Button>

        <p className="text-sm text-ink-100">
          Already have an account?{" "}
          <Link className="text-ink-300 hover:text-ink-100 underline underline-offset-4" href="/login">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}

