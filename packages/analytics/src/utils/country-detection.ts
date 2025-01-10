interface GeoInfo {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

export function getGeoFromHeaders(headers: Headers): GeoInfo {
  return {
    country: headers.get("x-vercel-ip-country") || undefined,
    city: headers.get("x-vercel-ip-city") || undefined,
    region: headers.get("x-vercel-ip-country-region") || undefined,
    timezone: headers.get("x-vercel-ip-timezone") || undefined,
  };
}
