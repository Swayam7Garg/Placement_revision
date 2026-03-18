"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";

export default function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error(await res.text());
        setStatus("ok");
        setMessage("Email verified successfully.");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed.");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <Card className="w-full max-w-md p-6 grid gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Verify email</h1>
          <p className={status === "ok" ? "text-base text-emerald-700" : "text-base text-ink-100"}>
            {message}
          </p>
        </div>
        <Link className="text-ink-300 hover:text-ink-100 underline underline-offset-4" href="/login">
          Go to login
        </Link>
      </Card>
    </div>
  );
}
