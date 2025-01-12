import { headers } from "next/headers";
import { DEFAULT_CONFIG } from "../config";
import { ServerAnalytics } from "../server";
import { type AnalyticsConfig } from "../types";

let serverInstance: ServerAnalytics | null = null;

/**
 * Returns the server-side analytics configuration.
 * This function is used to initialize the server-side analytics system.
 * It checks for the following environment variables:
 * - CASSINI_ENDPOINT: The endpoint URL for the analytics system.
 * - NEXT_PUBLIC_CASSINI_ENDPOINT: The endpoint URL for the analytics system.
 * If none of these variables are set, an error is thrown.
 */
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

/**
 * Creates a new server-side analytics instance.
 * It takes an optional configuration object as a parameter.
 * If no configuration is provided, the default configuration is used.
 */
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

/**
 * Tracks an analytics event on the server-side.
 * This function sends an analytics event to the analytics system.
 * It takes the following parameters:
 * - name: The name of the event.
 * - properties: An optional object of properties to be added to the event.
 */
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
