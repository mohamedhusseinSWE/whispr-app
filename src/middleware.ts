// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/",
  "/about",
  "/contact",
  "/pricing",
];
const PUBLIC_API_ROUTES = [
  "/api/trpc",
  "/api/uploadthing",
  "/api/webhooks/stripe",
];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const url = req.nextUrl.clone();

  // Debug logging (remove in production)
  console.log(
    `🔒 Middleware: ${req.method} ${url.pathname} - Token: ${token ? "Present" : "Missing"}`,
  );

  // Allow access to public routes
  if (PUBLIC_ROUTES.includes(url.pathname)) {
    return NextResponse.next();
  }

  // Allow access to public API routes
  if (PUBLIC_API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow access to static assets and public files
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.startsWith("/api/audio") || // Allow audio files to be served
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Protect all other routes (dashboard, API routes, etc.)
  if (!token) {
    console.log(`🚫 Access denied: No token for ${url.pathname}`);

    // For API routes, return JSON error
    if (url.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For page routes, redirect to login
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    const jwtSecret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);
    await jwtVerify(token, jwtSecret);
    console.log(`✅ Access granted: Valid token for ${url.pathname}`);
    return NextResponse.next();
  } catch (err) {
    console.error("JWT Error:", err);
    console.log(`🚫 Access denied: Invalid token for ${url.pathname}`);

    // For API routes, return JSON error
    if (url.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // For page routes, redirect to login
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (already handled above)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
