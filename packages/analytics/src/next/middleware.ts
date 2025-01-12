import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseUserAgent } from "../utils/device-detection";
import { generateVisitorHash } from "../utils/fingerprint";

export function analyticsMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip irrelevant paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent") || "";
  const ipAddress =
    // request.ip ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for") ||
    "";

  // Generate anonymous visitor ID
  const visitorId = generateVisitorHash(ipAddress, userAgent);

  const referrer = request.headers.get("referer") || "";
  const host = request.headers.get("host") || "";

  // Extract campaign data from URL if present
  const { searchParams } = request.nextUrl;
  const utm = {
    source: searchParams.get("utm_source"),
    medium: searchParams.get("utm_medium"),
    campaign: searchParams.get("utm_campaign"),
  };

  // Parse device info
  const deviceInfo = parseUserAgent(userAgent);

  // Get country from Vercel headers or similar
  const country = request.headers.get("x-vercel-ip-country");
  const city = request.headers.get("x-vercel-ip-city");

  // Track the pageview
  const eventData = {
    url: pathname,
    hostname: host,
    referrer: referrer,
    visitorId, // Anonymous, temporary ID
    device: deviceInfo,
    geo: {
      country,
      city,
    },
    utm,
    timestamp: Date.now(),
  };

  // Send to analytics endpoint (fire and forget)
  fetch(process.env.CASSINI_ENDPOINT as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.CASSINI_KEY as string,
    },
    body: JSON.stringify(eventData),
  }).catch(console.error);

  return NextResponse.next();
}
