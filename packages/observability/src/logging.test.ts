import { describe, expect, test } from "vitest";
import { createStructuredLogger, LOG_LEVEL } from "./logging";

describe("createStructuredLogger", () => {
  test("creates logs with correct structure", () => {
    const logs: any[] = [];
    const logger = createStructuredLogger({
      serviceName: "test-service",
      outputFn: (log) => logs.push(log),
    });

    logger.info("Test message", { foo: "bar" });

    expect(logs[0]).toMatchObject({
      level: LOG_LEVEL.INFO,
      message: "Test message",
      service: "test-service",
      metadata: {
        foo: "bar",
      },
    });
    expect(logs[0].timestamp).toBeDefined();
  });

  test("handles errors correctly", () => {
    const logs: any[] = [];
    const logger = createStructuredLogger({
      serviceName: "test-service",
      outputFn: (log) => logs.push(log),
    });

    const error = new Error("Test error");
    logger.error(error, { context: "testing" });

    expect(logs[0]).toMatchObject({
      level: LOG_LEVEL.ERROR,
      message: "Test error",
      service: "test-service",
      metadata: {
        context: "testing",
      },
      error: {
        name: "Error",
        message: "Test error",
        stack: error.stack,
      },
    });
  });

  test("respects minimum log level", () => {
    const logs: any[] = [];
    const logger = createStructuredLogger({
      serviceName: "test-service",
      minLevel: LOG_LEVEL.WARN,
      outputFn: (log) => logs.push(log),
    });

    logger.debug("Debug message");
    logger.info("Info message");
    logger.warn("Warning message");
    logger.error("Error message");

    expect(logs).toHaveLength(2);
    expect(logs[0].level).toBe(LOG_LEVEL.WARN);
    expect(logs[1].level).toBe(LOG_LEVEL.ERROR);
  });

  test("includes default metadata", () => {
    const logs: any[] = [];
    const logger = createStructuredLogger({
      serviceName: "test-service",
      defaultMetadata: { environment: "test" },
      outputFn: (log) => logs.push(log),
    });

    logger.info("Test message", { custom: "value" });

    expect(logs[0].metadata).toEqual({
      environment: "test",
      custom: "value",
    });
  });
});
