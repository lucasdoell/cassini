import { describe, expect, test } from "vitest";
import { createStructuredLogger, LOG_LEVEL } from "./logging";

describe("createStructuredLogger", () => {
  test("creates logs with correct structure", async () => {
    const logs: any[] = [];
    const logger = createStructuredLogger({
      serviceName: "test-service",
      outputFn: async (log) => {
        logs.push(log);
      },
    });

    await logger.info("Test message", { foo: "bar" });

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

  test("handles errors correctly", async () => {
    const logs: any[] = [];
    const logger = createStructuredLogger({
      serviceName: "test-service",
      outputFn: async (log) => {
        logs.push(log);
      },
    });

    const error = new Error("Test error");
    await logger.error(error, { context: "testing" });

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

  test("respects minimum log level", async () => {
    const logs: any[] = [];
    const logger = createStructuredLogger({
      serviceName: "test-service",
      minLevel: LOG_LEVEL.WARN,
      outputFn: async (log) => {
        logs.push(log);
      },
    });

    await logger.debug("Debug message");
    await logger.info("Info message");
    await logger.warn("Warning message");
    await logger.error("Error message");

    expect(logs).toHaveLength(2);
    expect(logs[0].level).toBe(LOG_LEVEL.WARN);
    expect(logs[1].level).toBe(LOG_LEVEL.ERROR);
  });

  test("includes default metadata", async () => {
    const logs: any[] = [];
    const logger = createStructuredLogger({
      serviceName: "test-service",
      defaultMetadata: { environment: "test" },
      outputFn: async (log) => {
        logs.push(log);
      },
    });

    await logger.info("Test message", { custom: "value" });

    expect(logs[0].metadata).toEqual({
      environment: "test",
      custom: "value",
    });
  });

  test("handles failed log submission gracefully", async () => {
    const mockOutputFn = async () => {
      throw new Error("Network error");
    };

    const logger = createStructuredLogger({
      serviceName: "test-service",
      outputFn: mockOutputFn,
    });

    // Should not throw
    await expect(logger.info("Test message")).resolves.not.toThrow();
  });
});

describe("createStructuredLogger with sync/async outputs", () => {
  test("sync output function creates synchronous logger", () => {
    const logs: any[] = [];
    const logger = createStructuredLogger({
      serviceName: "test-service",
      outputFn: (log) => {
        logs.push(log);
      },
    });

    // Should be able to use without await
    logger.info("Test message");
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe("Test message");
  });

  test("async output function creates asynchronous logger", async () => {
    const logs: any[] = [];
    const logger = createStructuredLogger({
      serviceName: "test-service",
      outputFn: async (log) => {
        await Promise.resolve();
        logs.push(log);
      },
    });

    // Need to await async logger
    await logger.info("Test message");
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe("Test message");
  });

  test("default output function creates asynchronous logger", async () => {
    const logger = createStructuredLogger({
      serviceName: "test-service",
    });

    // Default logger should be async
    // TypeScript should enforce awaiting this
    await logger.info("Test message");
  });

  test("handles errors in sync output function", () => {
    const logger = createStructuredLogger({
      serviceName: "test-service",
      outputFn: () => {
        throw new Error("Sync error");
      },
    });

    // Should not throw
    expect(() => logger.info("Test message")).not.toThrow();
  });

  test("handles errors in async output function", async () => {
    const logger = createStructuredLogger({
      serviceName: "test-service",
      outputFn: async () => {
        throw new Error("Async error");
      },
    });

    // Should not throw
    await expect(logger.info("Test message")).resolves.not.toThrow();
  });
});
