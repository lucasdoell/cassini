import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getGeoFromHeaders } from "../utils/country-detection";
import { parseUserAgent } from "../utils/device-detection";
import { createServerAnalytics } from "./server";

export function analyticsMiddleware(request: NextRequest) {
  const analytics = createServerAnalytics();
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent") || "";
  const deviceInfo = parseUserAgent(userAgent);
  const geoInfo = getGeoFromHeaders(request.headers);

  const properties = {
    url: request.nextUrl.toString(),
    referrer: request.headers.get("referer"),
    device: deviceInfo,
    geo: geoInfo,
    // UTM parameters
    utm: Object.fromEntries(
      ["source", "medium", "campaign", "term", "content"]
        .map((param) => [
          param,
          request.nextUrl.searchParams.get(`utm_${param}`),
        ])
        .filter(([_, value]) => value !== null)
    ),
  };

  analytics
    .track({
      name: "page_view",
      properties,
    })
    .catch(console.error);

  return NextResponse.next();
}
