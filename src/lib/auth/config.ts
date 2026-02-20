import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
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
  adapter: DEV_MODE ? undefined : DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: DEV_MODE ? { strategy: "jwt" } : undefined,
  providers: DEV_MODE
    ? [
        Credentials({
          name: "Dev Login",
          credentials: {
            email: { label: "Email", type: "email" },
          },
          async authorize(credentials) {
            // Dev mode: auto-create or find user
            const email = (credentials?.email as string) || "dev@appmake.dk";
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
          },
        }),
      ]
    : [GitHub, Google],
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
