import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { clearAuthFailures, isLocked, recordAuthFailure } from "./rate-limit";
import { BCRYPT_ROUNDS } from "./password";
import { isAdminEmail } from "./monetization";

const isProd = process.env.NODE_ENV === "production";

export { BCRYPT_ROUNDS };

/** Loose typing — next-auth type re-exports break under bundler resolution in this project. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: any = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  pages: {
    signIn: "/hy/auth/login",
  },
  cookies: {
    sessionToken: {
      name: isProd
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const failKey = `auth:${email}`;
        if (isLocked(failKey).locked) return null;

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            recordAuthFailure(failKey);
            return null;
          }

          if (user.suspended) {
            recordAuthFailure(failKey);
            return null;
          }

          const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
          if (!ok) {
            recordAuthFailure(failKey);
            return null;
          }

          clearAuthFailures(failKey);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isAdmin: user.role === "ADMIN" || isAdminEmail(user.email),
          };
        } catch (error) {
          console.error(
            "[Xndzor] authorize DB error",
            error instanceof Error ? error.message : error,
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/hy`;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isAdmin = user.isAdmin;
      } else if (token.id) {
        // Refresh role/admin flag so promotion takes effect without re-login
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, email: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.isAdmin =
              dbUser.role === "ADMIN" || isAdminEmail(dbUser.email);
          }
        } catch (error) {
          console.error(
            "[Xndzor] jwt callback DB error — using token claims",
            error instanceof Error ? error.message : error,
          );
        }
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, email: true },
          });
          if (dbUser) {
            session.user.role = dbUser.role;
            session.user.isAdmin =
              dbUser.role === "ADMIN" || isAdminEmail(dbUser.email);
          } else {
            session.user.role = token.role as string | undefined;
            session.user.isAdmin = Boolean(token.isAdmin);
          }
        } catch (error) {
          console.error(
            "[Xndzor] session callback DB error — using token claims",
            error instanceof Error ? error.message : error,
          );
          session.user.role = token.role as string | undefined;
          session.user.isAdmin = Boolean(token.isAdmin);
        }
      }
      return session;
    },
  },
};
