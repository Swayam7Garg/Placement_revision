"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function useAuth() {
  const { data, status } = useSession();
  const loading = status === "loading";
  const user = data
    ? {
        uid: (data as any).uid as string,
        email: data.user?.email || null,
        name: data.user?.name || null
      }
    : null;

  return {
    user,
    loading,
    signInWithEmail: async (email: string, password: string) =>
      signIn("credentials", { email, password, redirect: false }),
    signOutNow: async () => signOut({ callbackUrl: "/login" })
  };
}

