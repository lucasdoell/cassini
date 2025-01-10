export interface AnalyticsConfig {
  endpoint?: string;
  apiKey?: string;
  debug?: boolean;
  disabled?: boolean;
  batchSize?: number;
  flushInterval?: number;
  defaultTags?: Record<string, string>;
}

export interface AnalyticsEvent {
  name: string;
  timestamp: number;
  properties: Record<string, unknown>;
  userId?: string;
}

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

export interface EnrichedEventProperties extends Record<string, unknown> {
  url: string;
  referrer?: string;
  device: {
    type: "desktop" | "tablet" | "mobile";
    browser: string;
    os: string;
    screenSize?: string;
  };
  visitor: {
    id: string;
    returning: boolean;
  };
  geo?: {
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
  };
  session: {
    id: string;
    firstVisit: boolean;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}
