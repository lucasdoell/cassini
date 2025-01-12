import { analyticsMiddleware } from "@cassini/analytics/next/server";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return analyticsMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
