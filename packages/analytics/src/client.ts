import { AnalyticsConfig, AnalyticsEvent } from "./types";

export class ClientAnalytics {
  private readonly config: Required<AnalyticsConfig>;
  private queue: AnalyticsEvent[] = [];
  private flushTimeout?: number;

  constructor(config: Required<AnalyticsConfig>) {
    this.config = config;
    this.setupFlushInterval();
  }

  private setupFlushInterval(): void {
    if (this.config.flushInterval && typeof window !== "undefined") {
      this.flushTimeout = window.setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  async track(event: Omit<AnalyticsEvent, "timestamp">): Promise<void> {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.queue.push(fullEvent);

    if (this.queue.length >= (this.config.batchSize ?? 10)) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send events: ${response.statusText}`);
      }
    } catch (error) {
      // Requeue events on failure
      this.queue = [...events, ...this.queue];
      throw error;
    }
  }

  destroy(): void {
    if (typeof window !== "undefined" && this.flushTimeout) {
      window.clearInterval(this.flushTimeout);
    }
  }

  getEndpoint(): string {
    return this.config.endpoint;
  }
}
