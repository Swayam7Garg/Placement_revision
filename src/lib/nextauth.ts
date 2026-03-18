import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongo";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const db = await getDb();
        const user = await db.collection<any>("users").findOne({ email });
        if (!user) return null;
        if (!user.passwordHash) return null;
        if (!user.emailVerifiedAt) return null;

        const ok = await bcrypt.compare(password, String(user.passwordHash));
        if (!ok) return null;

        return { id: String(user._id), email: user.email };
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.uid = `user:${user.id}`;
      return token;
    },
    async session({ session, token }) {
      (session as any).uid = token.uid;
      return session;
    }
  }
};

