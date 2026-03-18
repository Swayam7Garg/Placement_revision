"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/client-auth";
import { Button, cn } from "@/components/ui";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/add", label: "Add" },
  { href: "/calendar", label: "Calendar" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOutNow } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur bg-bg-900/90 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-ink-50">
            Revision
            <span className="text-ink-300">.app</span>
          </Link>
          {/* Mobile menu toggles navigation for small screens. */}
          <button
            className="md:hidden h-10 px-3 rounded-xl border border-border text-sm text-ink-100"
            onClick={() => setNavOpen((v) => !v)}
            aria-expanded={navOpen}
            aria-controls="app-nav"
          >
            Menu
          </button>
        </div>
        <nav
          id="app-nav"
          className={cn(
            "mx-auto max-w-6xl px-4 pb-3 md:pb-0 md:h-14 md:flex md:items-center md:justify-end",
            navOpen ? "block" : "hidden md:block"
          )}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "text-base px-3 h-10 rounded-2xl grid place-items-center border border-transparent",
                  pathname === n.href
                    ? "bg-ink-500/10 text-ink-50 border-ink-500/30"
                    : "text-ink-100 hover:bg-bg-800 border-border"
                )}
              >
                {n.label}
              </Link>
            ))}
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => void signOutNow()}>
                Sign out
              </Button>
            ) : null}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

