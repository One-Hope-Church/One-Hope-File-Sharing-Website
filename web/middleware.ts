import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth is handled in layout and pages (getSession). API routes check session.
// Optional: redirect unauthenticated users from protected routes here if desired.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|favicon-512.png).*)"],
};
