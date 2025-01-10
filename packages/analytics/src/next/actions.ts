"use server";

import { ServerAnalytics } from "../server";
import { AnalyticsConfig } from "../types";

let actionInstance: ServerAnalytics | null = null;

export function initializeServerActions(config: Required<AnalyticsConfig>) {
  if (!actionInstance) {
    actionInstance = new ServerAnalytics(config);
  }
  return actionInstance;
}

export async function trackAction(
  name: string,
  properties: Record<string, unknown> = {}
) {
  if (!actionInstance) {
    throw new Error("Server actions analytics not initialized");
  }

  await actionInstance.track({
    name,
    properties: {
      ...properties,
      isServerAction: true,
    },
  });
}
