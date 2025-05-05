"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export function ThemeProvider({ children, ...props }: any) {
  // unprotected route
  const unprotectedRoutes = ["/auth/signin", "/auth/signup", "/auth/signout"];
  const { data: session, status } = useSession();

  const router = useRouter();
  const pathname = usePathname();
  const isProtectedRoute = !unprotectedRoutes.includes(pathname);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      if (isProtectedRoute) {
        router.push("/auth/signin");
      }
    }
  }, [status, router]);
  // check if session is loading
  if (status === "loading") {
    if (isProtectedRoute) {
      return (
        <div className="flex h-screen w-screen items-center justify-center dark:bg-gray-900 bg-gray-100">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      );
    }
  }
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
