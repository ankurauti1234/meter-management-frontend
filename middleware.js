// middleware.js
import { NextResponse } from "next/server";
import { parse } from "cookie";

const publicRoutes = ["/login","/survey",  "/activate", "/_next", "/static", "/assets", "/favicon.ico"];

export function middleware(request) {
  const cookieHeader = request.headers.get("cookie");
  // console.log("Raw cookie header:", cookieHeader);

  const parsedCookies = cookieHeader ? parse(cookieHeader) : {};
  const authToken = parsedCookies.token;
  // console.log("Parsed token:", authToken);

  const { pathname } = request.nextUrl;
  // console.log("Requested pathname:", pathname);

  // Allow public routes and static assets without token check
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    if (authToken && pathname === "/login") {
      // console.log("Redirecting logged-in user from /login to /");
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // For protected routes, redirect to login if no token
  if (!authToken) {
    // console.log("No auth token found, redirecting to /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // console.log("User authenticated, proceeding to:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};