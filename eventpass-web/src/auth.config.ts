import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/auth/signin" },
  providers: [],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const protectedPaths = ["/account", "/organiser", "/tickets"];
      if (protectedPaths.some((p) => nextUrl.pathname.startsWith(p))) {
        return loggedIn;
      }
      return true;
    },
  },
};
