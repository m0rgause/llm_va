import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user }: any) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.no_wa = user.no_wa;
        token.nama = user.nama;
      }
      return token;
    },
    session: async ({ session, token }: any) => {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.no_wa = token.no_wa;
        session.user.nama = token.nama;
      }
      return session;
    },
    // authorized: async ({ auth }) => {
    //   return !!auth; // Check if the user is authenticated
    // },
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [],
  // adapter: PrismaAdapter(prisma) as Adapter,
} satisfies NextAuthConfig;
