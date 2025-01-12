interface GeoInfo {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

// Helper to determine if we're in development
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

// Helper to determine if an IP is private/local
function isPrivateIP(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  );
}

export async function getGeoInfo(
  headers: Headers,
  ip?: string
): Promise<GeoInfo> {
  // First try Vercel headers
  const vercelGeo = {
    country: headers.get("x-vercel-ip-country") ?? undefined,
    city: headers.get("x-vercel-ip-city") ?? undefined,
    region: headers.get("x-vercel-ip-country-region") ?? undefined,
    timezone: headers.get("x-vercel-ip-timezone") ?? undefined,
  };

  // If we have Vercel data, use it
  if (vercelGeo.country) {
    return vercelGeo;
  }

  // Get timezone using Intl API
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // If we're in development or have a private IP, return development defaults
  if (isDevelopment() || (ip && isPrivateIP(ip))) {
    return {
      country: "US",
      city: "Development",
      region: "Local",
      timezone,
    };
  }

  try {
    // For production, we can use a geolocation service
    // Here using ipapi.co as an example (free tier available)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();

    return {
      country: data.country_code,
      city: data.city,
      region: data.region,
      timezone: data.timezone || timezone,
    };
  } catch (error) {
    // Fallback to basic info if geolocation fails
    return {
      timezone,
    };
  }
}
