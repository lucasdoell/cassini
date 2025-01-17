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
  outputFn?: (log: StructuredLog) => void;
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
 * Creates a structured logger with OpenTelemetry integration.
 *
 * @example
 * ```typescript
 * const logger = createStructuredLogger({
 *   serviceName: 'user-service',
 *   defaultMetadata: { environment: 'production' }
 * });
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error(new Error('Authentication failed'), { userId: '123' });
 * ```
 */
export function createStructuredLogger({
  serviceName,
  minLevel = LOG_LEVEL.DEBUG,
  defaultMetadata = {},
  outputFn = console.log,
}: LoggerConfig) {
  const logLevels: Record<LogLevel, number> = {
    [LOG_LEVEL.DEBUG]: 0,
    [LOG_LEVEL.INFO]: 1,
    [LOG_LEVEL.WARN]: 2,
    [LOG_LEVEL.ERROR]: 3,
  };

  /**
   * Creates a structured log entry with current trace context.
   */
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

  /**
   * Checks if a log level should be recorded based on minimum level.
   */
  function shouldLog(level: LogLevel): boolean {
    return logLevels[level] >= logLevels[minLevel];
  }

  return {
    debug(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.DEBUG)) {
        outputFn(createLogEntry(LOG_LEVEL.DEBUG, message, metadata));
      }
    },

    info(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.INFO)) {
        outputFn(createLogEntry(LOG_LEVEL.INFO, message, metadata));
      }
    },

    warn(message: string, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.WARN)) {
        outputFn(createLogEntry(LOG_LEVEL.WARN, message, metadata));
      }
    },

    error(message: string | Error, metadata?: Record<string, unknown>) {
      if (shouldLog(LOG_LEVEL.ERROR)) {
        outputFn(createLogEntry(LOG_LEVEL.ERROR, message, metadata));
      }
    },
  };
}

export { LOG_LEVEL };
