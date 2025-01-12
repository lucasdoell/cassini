import { headers } from "next/headers";
import { DEFAULT_CONFIG } from "../config";
import { ServerAnalytics } from "../server";
import { type AnalyticsConfig } from "../types";

let serverInstance: ServerAnalytics | null = null;

function getServerConfig(): AnalyticsConfig {
  if (
    !process.env.CASSINI_ENDPOINT &&
    !process.env.NEXT_PUBLIC_CASSINI_ENDPOINT
  ) {
    throw new Error(
      "Error initializing Cassini Analytics: No server endpoint provided."
    );
  }

  if (!process.env.CASSINI_KEY && !process.env.NEXT_PUBLIC_CASSINI_KEY) {
    throw new Error(
      "Error initializing Cassini Analytics: No API key provided."
    );
  }

  return {
    endpoint:
      process.env.CASSINI_ENDPOINT || process.env.NEXT_PUBLIC_CASSINI_ENDPOINT,
    apiKey: process.env.CASSINI_KEY || process.env.NEXT_PUBLIC_CASSINI_KEY,
  };
}

export function createServerAnalytics(
  config = DEFAULT_CONFIG
): ServerAnalytics {
  if (!serverInstance) {
    serverInstance = new ServerAnalytics({
      ...getServerConfig(),
      ...config,
    });
  }
  return serverInstance;
}

export async function track(
  name: string,
  properties: Record<string, unknown> = {}
) {
  const analytics = createServerAnalytics();
  const headersList = headers();

  // Gather common server-side context
  const commonProperties = {
    userAgent: (await headersList).get("user-agent"),
    referer: (await headersList).get("referer"),
    host: (await headersList).get("host"),
    path: (await headersList).get("x-invoke-path"),
    isServer: true,
  };

  await analytics.track({
    name,
    properties: {
      ...commonProperties,
      ...properties,
    },
  });
}

export * from "./middleware";
