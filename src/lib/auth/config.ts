import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DEV_MODE = !process.env.AUTH_GITHUB_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DEV_MODE
    ? undefined
    : DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      }),
  session: { strategy: "jwt" },
  providers: [
    // Email + password credentials (always available)
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        const password = credentials?.password as string;

        if (!email) return null;

        // Dev mode shortcut: no password needed for dev@appmake.dk
        if (DEV_MODE && email === "dev@appmake.dk" && !password) {
          let user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });
          if (!user) {
            const [created] = await db
              .insert(users)
              .values({ email, name: "Dev User" })
              .returning();
            user = created;
          }
          return { id: user.id, email: user.email, name: user.name };
        }

        // Normal email/password login
        if (!password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user?.hashedPassword) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    // OAuth providers (production only)
    ...(DEV_MODE ? [] : [GitHub, Google]),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token, user }) {
      if (token?.id) {
        session.user.id = token.id as string;
      } else if (user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
