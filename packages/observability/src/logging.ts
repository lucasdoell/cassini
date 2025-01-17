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

type SyncLogOutput = (log: StructuredLog) => void;
type AsyncLogOutput = (log: StructuredLog) => Promise<void>;

export interface LoggerConfig<
  T extends SyncLogOutput | AsyncLogOutput = AsyncLogOutput
> {
  /** Name of the service or component using the logger */
  serviceName: string;
  /** Minimum log level to record. Defaults to DEBUG */
  minLevel?: LogLevel;
  /** Additional context to include with every log */
  defaultMetadata?: Record<string, unknown>;
  /** Function to handle the structured log output. Can be sync or async */
  outputFn?: T;
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

interface SyncLogger {
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string | Error, metadata?: Record<string, unknown>): void;
}

interface AsyncLogger {
  debug(message: string, metadata?: Record<string, unknown>): Promise<void>;
  info(message: string, metadata?: Record<string, unknown>): Promise<void>;
  warn(message: string, metadata?: Record<string, unknown>): Promise<void>;
  error(
    message: string | Error,
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/**
 * Creates a default output function that sends logs to the OpenTelemetry collector.
 */
function createDefaultOutputFn(
  serviceName: string,
  exporterUrl?: string
): AsyncLogOutput {
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
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Service-Name": serviceName,
        },
        // We add a `type` field to the log to distinguish it from other observability data
        // With Cassini, we can use this to filter out logs from other observability systems such as spans and metrics
        body: JSON.stringify({ type: "structured_log", ...log }),
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

export function createStructuredLogger<
  T extends SyncLogOutput | AsyncLogOutput
>(config: LoggerConfig<T>): T extends SyncLogOutput ? SyncLogger : AsyncLogger;

/**
 * Creates a structured logger that can be either synchronous or asynchronous
 * based on the type of output function provided.
 */
export function createStructuredLogger({
  serviceName,
  minLevel = LOG_LEVEL.DEBUG,
  defaultMetadata = {},
  exporterUrl,
  outputFn,
}: LoggerConfig): SyncLogger | AsyncLogger {
  const logLevels: Record<LogLevel, number> = {
    [LOG_LEVEL.DEBUG]: 0,
    [LOG_LEVEL.INFO]: 1,
    [LOG_LEVEL.WARN]: 2,
    [LOG_LEVEL.ERROR]: 3,
  };

  // Use provided outputFn or create default one
  const sendLog = outputFn || createDefaultOutputFn(serviceName, exporterUrl);
  const isAsync = sendLog.constructor.name === "AsyncFunction" || !outputFn;

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

  const syncMethods: SyncLogger = {
    debug(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.DEBUG)) {
        try {
          (sendLog as SyncLogOutput)(
            createLogEntry(LOG_LEVEL.DEBUG, message, metadata)
          );
        } catch (error) {
          console.error("Failed to send debug log:", error);
        }
      }
    },

    info(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.INFO)) {
        try {
          (sendLog as SyncLogOutput)(
            createLogEntry(LOG_LEVEL.INFO, message, metadata)
          );
        } catch (error) {
          console.error("Failed to send info log:", error);
        }
      }
    },

    warn(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.WARN)) {
        try {
          (sendLog as SyncLogOutput)(
            createLogEntry(LOG_LEVEL.WARN, message, metadata)
          );
        } catch (error) {
          console.error("Failed to send warn log:", error);
        }
      }
    },

    error(message: string | Error, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.ERROR)) {
        try {
          (sendLog as SyncLogOutput)(
            createLogEntry(LOG_LEVEL.ERROR, message, metadata)
          );
        } catch (error) {
          console.error("Failed to send error log:", error);
        }
      }
    },
  };

  const asyncMethods: AsyncLogger = {
    async debug(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.DEBUG)) {
        try {
          await (sendLog as AsyncLogOutput)(
            createLogEntry(LOG_LEVEL.DEBUG, message, metadata)
          );
        } catch (error) {
          console.error("Failed to send debug log:", error);
        }
      }
    },

    async info(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.INFO)) {
        try {
          await (sendLog as AsyncLogOutput)(
            createLogEntry(LOG_LEVEL.INFO, message, metadata)
          );
        } catch (error) {
          console.error("Failed to send info log:", error);
        }
      }
    },

    async warn(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.WARN)) {
        try {
          await (sendLog as AsyncLogOutput)(
            createLogEntry(LOG_LEVEL.WARN, message, metadata)
          );
        } catch (error) {
          console.error("Failed to send warn log:", error);
        }
      }
    },

    async error(message: string | Error, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.ERROR)) {
        try {
          await (sendLog as AsyncLogOutput)(
            createLogEntry(LOG_LEVEL.ERROR, message, metadata)
          );
        } catch (error) {
          console.error("Failed to send error log:", error);
        }
      }
    },
  };

  return isAsync ? asyncMethods : syncMethods;
}

export { LOG_LEVEL };
