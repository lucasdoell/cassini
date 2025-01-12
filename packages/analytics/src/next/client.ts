import { DEFAULT_CONFIG } from "../config";
import type { AnalyticsConfig, AnalyticsEvent } from "./../types";

export class ClientAnalytics {
  private readonly config: Required<AnalyticsConfig>;
  private queue: AnalyticsEvent[] = [];
  private flushTimeout?: number;

  constructor(config: AnalyticsConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    this.setupFlushInterval();
    this.setupUnloadListener();
  }

  private setupFlushInterval(): void {
    if (this.config.flushInterval && typeof window !== "undefined") {
      this.flushTimeout = window.setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  private async sendData(events: AnalyticsEvent[]): Promise<boolean> {
    const body = JSON.stringify({ events });
    const url = this.config.endpoint;

    // Try sendBeacon first
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        const blob = new Blob([body], { type: "application/json" });
        const success = navigator.sendBeacon(url, blob);
        if (success) return true;
      } catch (error) {
        if (this.config.debug) {
          console.warn("SendBeacon failed, falling back to fetch:", error);
        }
      }
    }

    // Fallback to fetch without credentials
    try {
      const response = await fetch(url, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        keepalive: true,
        // Don't include credentials to avoid CORS preflight requests
        credentials: "omit",
      });

      return response.ok;
    } catch (error) {
      if (this.config.debug) {
        console.error("Failed to send analytics data:", error);
      }
      return false;
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

    const success = await this.sendData(events);

    if (!success) {
      // Requeue events on failure
      this.queue = [...events, ...this.queue];
    }
  }

  // Important: Flush remaining events before page unload
  private setupUnloadListener(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.flush();
        }
      });

      // Backup using unload
      window.addEventListener("unload", () => {
        this.flush();
      });
    }
  }

  // Clean up method
  destroy(): void {
    if (typeof window !== "undefined") {
      if (this.flushTimeout) {
        window.clearInterval(this.flushTimeout);
      }
      // Flush any remaining events
      this.flush();
    }
  }

  getEndpoint(): string {
    return this.config.endpoint;
  }
}
