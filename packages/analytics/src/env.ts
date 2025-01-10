import { AnalyticsConfig } from "./types";

export function getEnvironmentConfig(): Partial<AnalyticsConfig> {
  if (typeof process === "undefined") return {};

  return {
    endpoint:
      process.env.NEXT_PUBLIC_CASSINI_ENDPOINT || process.env.CASSINI_ENDPOINT,
    apiKey: process.env.NEXT_PUBLIC_CASSINI_KEY || process.env.CASSINI_KEY,
    debug: process.env.NEXT_PUBLIC_CASSINI_DEBUG === "true",
    disabled: process.env.NEXT_PUBLIC_CASSINI_DISABLED === "true",
  };
}
