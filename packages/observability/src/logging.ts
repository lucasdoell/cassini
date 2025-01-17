import { SpanStatusCode, trace } from "@opentelemetry/api";

/**
 * Available log levels for the structured logger.
 */
const LOG_LEVEL = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
} as const;

/**
 * Type representing available log levels.
 */
type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

/**
 * Configuration options for the structured logger.
 */
export interface LoggerConfig {
  /** Name of the service or component using the logger */
  serviceName: string;
  /** Minimum log level to record. Defaults to DEBUG */
  minLevel?: LogLevel;
  /** Additional context to include with every log */
  defaultMetadata?: Record<string, unknown>;
  /** Optional function to handle the structured log output */
  outputFn?: (log: StructuredLog) => Promise<void>;
  /** Optional custom URL for the OpenTelemetry collector */
  exporterUrl?: string;
}

/**
 * Structure of a log entry produced by the logger.
 */
export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  traceId?: string;
  spanId?: string;
}

/**
 * Creates a default output function that sends logs to the OpenTelemetry collector.
 */
function createDefaultOutputFn(serviceName: string, exporterUrl?: string) {
  const url =
    exporterUrl ||
    process.env.OTEL_API_URL ||
    "http://localhost:3001/observability";

  return async function sendLog(log: StructuredLog): Promise<void> {
    const consoleMethod = log.level.toLowerCase() as Lowercase<
      keyof typeof LOG_LEVEL
    >;
    const logData = {
      message: log.message,
      ...log.metadata,
      traceId: log.traceId,
      spanId: log.spanId,
      ...(log.error && { error: log.error }),
    };

    console[consoleMethod](`[${log.service}] ${log.message}`, logData);

    try {
      const response = await fetch(`${url}/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Service-Name": serviceName,
        },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to send log:", await response.text());
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to send log:", error);
      }
    }
  };
}

/**
 * Creates a structured logger with OpenTelemetry integration.
 *
 * @example
 * ```typescript
 * const logger = createStructuredLogger({
 *   serviceName: 'user-service',
 *   defaultMetadata: { environment: 'production' }
 * });
 *
 * await logger.info('User logged in', { userId: '123' });
 * await logger.error(new Error('Authentication failed'), { userId: '123' });
 * ```
 */
export function createStructuredLogger({
  serviceName,
  minLevel = LOG_LEVEL.DEBUG,
  defaultMetadata = {},
  exporterUrl,
  outputFn,
}: LoggerConfig) {
  const logLevels: Record<LogLevel, number> = {
    [LOG_LEVEL.DEBUG]: 0,
    [LOG_LEVEL.INFO]: 1,
    [LOG_LEVEL.WARN]: 2,
    [LOG_LEVEL.ERROR]: 3,
  };

  const sendLog = outputFn || createDefaultOutputFn(serviceName, exporterUrl);

  function createLogEntry(
    level: LogLevel,
    message: string | Error,
    metadata: Record<string, unknown> = {}
  ): StructuredLog {
    const activeSpan = trace.getActiveSpan();
    const spanContext = activeSpan?.spanContext();

    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message: message instanceof Error ? message.message : message,
      service: serviceName,
      metadata: { ...defaultMetadata, ...metadata },
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
    };

    if (message instanceof Error) {
      log.error = {
        name: message.name,
        message: message.message,
        stack: message.stack,
      };

      if (activeSpan) {
        activeSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: message.message,
        });
        activeSpan.recordException(message);
      }
    }

    return log;
  }

  function shouldLog(level: LogLevel): boolean {
    return logLevels[level] >= logLevels[minLevel];
  }

  return {
    async debug(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.DEBUG)) {
        try {
          await sendLog(createLogEntry(LOG_LEVEL.DEBUG, message, metadata));
        } catch (error) {
          console.error("Failed to send debug log:", error);
        }
      }
    },

    async info(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.INFO)) {
        try {
          await sendLog(createLogEntry(LOG_LEVEL.INFO, message, metadata));
        } catch (error) {
          console.error("Failed to send info log:", error);
        }
      }
    },

    async warn(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.WARN)) {
        try {
          await sendLog(createLogEntry(LOG_LEVEL.WARN, message, metadata));
        } catch (error) {
          console.error("Failed to send warn log:", error);
        }
      }
    },

    async error(message: string | Error, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.ERROR)) {
        try {
          await sendLog(createLogEntry(LOG_LEVEL.ERROR, message, metadata));
        } catch (error) {
          console.error("Failed to send error log:", error);
        }
      }
    },
  };
}

export { LOG_LEVEL };
