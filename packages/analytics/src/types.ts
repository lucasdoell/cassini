/**
 * Configuration options for the analytics system.
 * These options can be passed to the `Analytics` component. This is an optional parameter.
 * If not provided, the default configuration will be used.
 */
export interface AnalyticsConfig {
  /** The endpoint to send analytics events to. This is usually a URL to your Cassini backend. The default value is "http://localhost:3001/analytics". */
  endpoint?: string;
  /** Your Cassini API key. This is required to send analytics events to your Cassini backend. The default value is an empty string. */
  apiKey?: string;
  /** Enables debug mode. This will log all analytics events to the console. The default value is false. */
  debug?: boolean;
  /** Disables analytics tracking. This can be useful for testing or if you want to manually send events. The default value is false. */
  disabled?: boolean;
  /** The maximum number of events to send in a single batch. The default value is 10. */
  batchSize?: number;
  /** The interval in milliseconds to flush events to the server. The default value is 5000 (5 seconds). */
  flushInterval?: number;
  /** Default tags to be added to all events. These can be overridden by individual events. */
  defaultTags?: Record<string, string>;
}

/**
 * Represents an analytics event that can be tracked in the analytics system.
 * The event includes the following properties:
 * - `name`: The name of the event.
 * - `timestamp`: The timestamp of the event in milliseconds since the Unix epoch.
 * - `properties`: The properties of the event, which can be any JSON-serializable value.
 * - `userId`: The user ID of the event, used to identify the user across sessions.
 */
export interface AnalyticsEvent {
  /** The name of the event. */
  name: string;
  /** The timestamp of the event in milliseconds since the Unix epoch. */
  timestamp: number;
  /** The properties of the event. These can be any JSON-serializable value. */
  properties: Record<string, unknown>;
  /** The user ID of the event. This is used to identify the user across sessions. */
  userId?: string;
}

/**
 * Represents the different types of metrics that can be tracked in the analytics system.
 * These metrics include:
 * - CLS: Cumulative Layout Shift
 * - FCP: First Contentful Paint
 * - FID: First Input Delay
 * - INP: Interaction to Next Paint
 * - LCP: Largest Contentful Paint
 * - TTFB: Time to First Byte
 * - Next.js-hydration: Time taken for Next.js hydration
 * - Next.js-route-change-to-render: Time taken for Next.js route change to render
 * - Next.js-render: Time taken for Next.js render
 */
export type MetricType =
  | "CLS"
  | "FCP"
  | "FID"
  | "INP"
  | "LCP"
  | "TTFB"
  | "Next.js-hydration"
  | "Next.js-route-change-to-render"
  | "Next.js-render";
