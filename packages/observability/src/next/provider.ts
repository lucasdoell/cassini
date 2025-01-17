import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { registerOTel } from "@vercel/otel";

export type CassiniProviderConfig = {
  serviceName: string;
} & Partial<ExporterOptions>;

type ExporterOptions = {
  processSpans: boolean;
  exporterUrl: string;
};

export function registerCassiniObservability({
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
                "http://localhost:3001/observability",
            })
          ),
        ]
      : [],
  };

  registerOTel(config);
}
