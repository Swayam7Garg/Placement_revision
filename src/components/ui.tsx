"use client";

import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<string | undefined | null | false>) {
  return twMerge(clsx(inputs));
}

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-3xl bg-card border border-border shadow-glow transition hover:shadow-lg",
        props.className
      )}
    />
  );
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "danger";
    size?: "sm" | "md";
  }
) {
  const { variant = "primary", size = "md", className, ...rest } = props;
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-500/40 disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" ? "h-10 px-4 text-sm" : "h-11 px-5 text-base",
        variant === "primary" &&
          "bg-ink-500 text-bg-950 hover:bg-ink-500/90 active:bg-ink-500",
        variant === "ghost" &&
          "bg-transparent text-ink-100 hover:bg-bg-800 border border-border",
        variant === "danger" &&
          "bg-red-600/90 text-white hover:bg-red-600",
        className
      )}
    />
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, className, ...rest } = props;
  return (
    <label className="grid gap-1 text-base text-ink-100">
      {label ? <span className="text-ink-100">{label}</span> : null}
      <input
        {...rest}
        className={cn(
          "h-11 rounded-2xl bg-bg-950/40 border border-border px-3 text-base text-ink-50 placeholder:text-ink-300/70 focus:outline-none focus:ring-2 focus:ring-ink-500/40",
          className
        )}
      />
    </label>
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
) {
  const { label, className, ...rest } = props;
  return (
    <label className="grid gap-1 text-base text-ink-100">
      {label ? <span className="text-ink-100">{label}</span> : null}
      <textarea
        {...rest}
        className={cn(
          "min-h-28 rounded-2xl bg-bg-950/40 border border-border p-3 text-base text-ink-50 placeholder:text-ink-300/70 focus:outline-none focus:ring-2 focus:ring-ink-500/40",
          className
        )}
      />
    </label>
  );
}

export function Badge({
  children,
  tone = "blue"
}: {
  children: React.ReactNode;
  tone?: "blue" | "gray" | "red" | "green";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-ink-500/15 text-ink-100 border-ink-500/30"
      : tone === "red"
        ? "bg-red-500/15 text-red-100 border-red-500/30"
        : tone === "green"
          ? "bg-emerald-500/15 text-emerald-100 border-emerald-500/30"
          : "bg-white/5 text-ink-100 border-white/10";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
        toneClass
      )}
    >
      {children}
    </span>
  );
}

