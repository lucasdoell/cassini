import { Span as OTelSpan, SpanStatusCode, trace } from "@opentelemetry/api";

export type Span = OTelSpan;

/**
 * Configuration options for creating a traced operation.
 *
 * @template T - The return type of the operation being traced
 */
type SpanConfig<T> = {
  /**
   * Name of the service creating the span. This should be a unique identifier
   * for the service or component performing the operation.
   */
  serviceName: string;

  /**
   * Name of the span being created. This should describe the operation
   * being performed (e.g., 'fetchUserData', 'processPayment').
   */
  activeSpanName: string;

  /**
   * The async operation to execute within the span. Receives the span instance
   * as a parameter to allow for adding additional attributes or events during execution.
   *
   * @param span - The OpenTelemetry span instance for the operation
   * @returns A promise that resolves with the operation result
   */
  operation: (span: Span) => Promise<T>;

  /**
   * Optional attributes to set on the span at creation time.
   * These attributes can help with filtering and analyzing traces.
   *
   * @example
   * {
   *   'user.id': '123',
   *   'operation.type': 'database',
   *   'retry.count': 3
   * }
   */
  attributes?: Record<string, string | number | boolean>;
};

/**
 * Creates and manages an OpenTelemetry span around an asynchronous operation.
 * Automatically handles span lifecycle, error tracking, and attribute setting.
 *
 * @template T - The return type of the operation being traced
 * @param config - Configuration for the span and the operation to trace
 * @param config.serviceName - Name of the service creating the span
 * @param config.activeSpanName - Name of the span being created
 * @param config.operation - The async operation to execute within the span
 * @param config.attributes - Optional attributes to set on the span
 *
 * @returns A promise that resolves with the result of the operation
 *
 * @example
 * const result = await withSpan({
 *   serviceName: 'user-service',
 *   activeSpanName: 'fetchUserData',
 *   attributes: { 'user.id': userId },
 *   operation: async (span) => {
 *     const data = await fetchUser(userId);
 *     span.setAttribute('user.role', data.role);
 *     return data;
 *   },
 * });
 */
export async function withSpan<T>(config: SpanConfig<T>): Promise<T> {
  const { serviceName, activeSpanName, operation, attributes } = config;

  return await trace
    .getTracer(serviceName)
    .startActiveSpan(activeSpanName, async (span) => {
      try {
        if (attributes) span.setAttributes(attributes);

        const result = await operation(span);

        span.setStatus({ code: SpanStatusCode.OK });

        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Unknown error",
        });

        if (error instanceof Error) span.recordException(error);

        throw error;
      } finally {
        span.end();
      }
    });
}
