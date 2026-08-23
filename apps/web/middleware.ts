import { NextRequest, NextResponse } from "next/server";

function unauthorized(message = "Authentication required") {
  return new NextResponse(message, {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ThingsO Admin", charset="UTF-8"' },
  });
}

export function middleware(request: NextRequest) {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) {
    return new NextResponse("Admin access is disabled until ADMIN_AUTH_SECRET is configured.", { status: 503 });
  }
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();
  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    const username = separator >= 0 ? decoded.slice(0, separator) : "";
    const password = separator >= 0 ? decoded.slice(separator + 1) : "";
    if (username !== "admin" || password !== secret) return unauthorized("Invalid credentials");
  } catch {
    return unauthorized("Invalid credentials");
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
