import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { registerOTel } from "@vercel/otel";

/**
 * Configuration options for Cassini's OpenTelemetry registration.
 */
export type CassiniProviderConfig = {
  /**
   * Name of the service being instrumented.
   */
  serviceName: string;

  /**
   * Whether to process and export spans. Defaults to true.
   */
  processSpans?: boolean;

  /**
   * Custom URL for the OpenTelemetry collector.
   * Defaults to process.env.OTEL_API_URL or "http://localhost:8080/observability"
   */
  exporterUrl?: string;
};

/**
 * Registers Cassini's OpenTelemetry instrumentation with the specified configuration.
 * Should be included in your Next.js app's `instrumentation.ts` file. For example:
 *
 * ```ts
 * import { registerCassiniObservability } from "@cassini/analytics/next";
 *
 * export function register() {
 *   registerCassiniObservability({
 *     serviceName: "my-app",
 *     ...
 *   });
 * }
 * ```
 *
 * @param config - Configuration options for the OpenTelemetry registration
 * @param config.serviceName - Name of the service being instrumented
 * @param config.processSpans - Whether to process and export spans (defaults to true)
 * @param config.exporterUrl - Optional custom URL for the OpenTelemetry collector. Defaults to process.env.OTEL_API_URL or "http://localhost:8080/observability" if no value is provided.
 */
export function registerCassiniOTel({
  serviceName,
  processSpans = true,
  exporterUrl,
}: CassiniProviderConfig) {
  if (typeof process === "undefined" || process.env.NEXT_RUNTIME !== "nodejs") {
    // Skip if not running in Node.js
    // Support for other runtimes (e.g. Vercel Edge) may be added in the future
    return;
  }

  const config = {
    serviceName,
    spanProcessors: processSpans
      ? [
          new BatchSpanProcessor(
            new OTLPTraceExporter({
              url:
                exporterUrl ||
                process.env.OTEL_API_URL ||
                "http://localhost:8080/observability",
            })
          ),
        ]
      : [],
  };

  registerOTel(config);
}
