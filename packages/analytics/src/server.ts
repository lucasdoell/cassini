import { AnalyticsConfig, AnalyticsEvent } from "./types";

export class ServerAnalytics {
  private readonly config: Required<AnalyticsConfig>;

  constructor(config: Required<AnalyticsConfig>) {
    this.config = config;
  }

  async track(event: Omit<AnalyticsEvent, "timestamp">): Promise<void> {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Server-side events are sent immediately
    try {
      const response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ events: [fullEvent] }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send event: ${response.statusText}`);
      }
    } catch (error) {
      // In a server context, we might want to log this to your observability system
      console.error("Failed to send analytics event:", error);
      throw error;
    }
  }
}
