import { LOG_LEVEL } from "./logging";

/**
 * Type representing available log levels.
 */
export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

export type SyncLogOutput = (log: StructuredLog) => void;
export type AsyncLogOutput = (log: StructuredLog) => Promise<void>;

export type IsAsync<T> = T extends (...args: any[]) => Promise<any>
  ? true
  : false;

export interface LoggerConfig<
  T extends SyncLogOutput | AsyncLogOutput | undefined = undefined
> {
  /** Name of the service or component using the logger */
  serviceName: string;
  /** Minimum log level to record. Defaults to DEBUG */
  minLevel?: LogLevel;
  /** Additional context to include with every log */
  defaultMetadata?: Record<string, unknown>;
  /** Function to handle the structured log output. Can be sync or async */
  outputFn?: T extends undefined ? SyncLogOutput | AsyncLogOutput : T;
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
 * Base type for logger method parameters
 */
export type LogMethodParams = {
  [K in LogLevel]: K extends "ERROR"
    ? [message: string | Error, metadata?: Record<string, unknown>]
    : [message: string, metadata?: Record<string, unknown>];
};

/**
 * Creates a logger interface with either sync or async methods
 */
export type CreateLogger<TReturn> = {
  [K in LogLevel as Lowercase<K>]: (...args: LogMethodParams[K]) => TReturn;
};

export type SyncLogger = CreateLogger<void>;
export type AsyncLogger = CreateLogger<Promise<void>>;
