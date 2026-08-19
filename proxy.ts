import { NextRequest, NextResponse } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/auth/crypto";

const protectedPrefixes = [
  "/dashboard",
  "/clients",
  "/invoices",
  "/quotes",
  "/payments",
  "/expenses",
  "/catalog",
  "/suppliers",
  "/reports",
  "/import",
  "/conversations",
  "/settings",
  "/billing",
];

const authRoutes = ["/login", "/register"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Intercept logout/clear_session first
  const clearSession = req.nextUrl.searchParams.get("clear_session");
  if (clearSession === "1") {
    const res = NextResponse.redirect(new URL("/login", req.nextUrl));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  const isProtected = protectedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  const isAuthRoute = authRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(cookie);
  const isLoggedIn = Boolean(session?.userId && session?.organizationId);

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
