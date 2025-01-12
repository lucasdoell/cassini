import { AnalyticsConfig } from "./types";

export const DEFAULT_CONFIG: Required<AnalyticsConfig> = {
  endpoint: "http://localhost:3001/analytics",
  apiKey: "", // Will be automatically populated from env vars
  debug: false,
  disabled: false,
  batchSize: 10,
  flushInterval: 5000,
  defaultTags: {},
};
