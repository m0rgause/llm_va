import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/prisma";
import { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import type { Provider } from "next-auth/providers";

export class CustomError extends CredentialsSignin {
  code = "custom";
  constructor(code?: any, errorOptions?: any) {
    super(code, errorOptions);
    const messageArray = this.message.split(".");
    this.code = messageArray[0];
  }
}

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (
      credentials
    ): Promise<{
      id: string;
      email: string;
      nama: string;
      role: "user" | "administrator";
      no_wa: string;
    }> => {
      const email = credentials.email as string;
      const password = credentials.password as string;
      try {
        const user: any = await prisma.user.findUnique({
          where: { email },
        });
        if (user) {
          if (await bcrypt.compare(password, user.password)) {
            return {
              id: user.id,
              email: user.email,
              nama: user.nama,
              role: user.role as "user" | "administrator",
              no_wa: user.no_whatsapp,
            };
          }
          throw new CustomError("Wrong password");
        }
        throw new CustomError("User not found");
      } catch (error: any) {
        throw new CustomError(error.message);
      }
    },
  }),
];

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    } else {
      return { id: provider.id, name: provider.name };
    }
  })
  .filter((provider) => provider.id !== "credentials");

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  // adapter: PrismaAdapter(prisma) as Adapter,
  providers,
});
