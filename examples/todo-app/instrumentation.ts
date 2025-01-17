import { registerCassiniObservability } from "@cassini/observability/next";

export function register() {
  registerCassiniObservability({ serviceName: "todo-app" });
}
