import { AnalyticsConfig } from "./types";

/**
 * The default configuration for the analytics system.
 * This configuration can be overridden by passing a custom configuration to the `Analytics` component.
 * If no custom configuration is provided, this configuration will be used.
 */
export const DEFAULT_CONFIG: Required<AnalyticsConfig> = {
  endpoint: "http://localhost:8080/analytics",
  apiKey: "", // Will be automatically populated from env vars
  debug: false,
  disabled: false,
  batchSize: 10,
  flushInterval: 5000,
  defaultTags: {},
};
