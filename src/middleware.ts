import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/dashboard/semester", request.url));
  }

  const publicRoutes = ["/auth", "/favicon.ico", "/api"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // admin only routes
  if (
    pathname.startsWith("/administrator") &&
    token?.role !== "administrator"
  ) {
    return NextResponse.redirect(new URL("/dashboard/semester", request.url));
  }

  // routes that require login (any role)
  const protectedRoutes = ["/dashboard", "/chat", "/krs"];
  const needsAuth = protectedRoutes.some((route) => pathname.startsWith(route));
  if (needsAuth && !token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/administrator/:path*",
    "/dashboard/:path*",
    "/chat/:path*",
    "/krs/:path*",
  ],
};
