import { registerCassiniOTel } from "@cassini/observability/next";

export function register() {
  registerCassiniOTel({ serviceName: "todo-app" });
}
