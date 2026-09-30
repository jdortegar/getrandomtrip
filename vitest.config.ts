import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      config: path.resolve(__dirname, "./config"),
    },
  },
  test: {
    // Existing behavior suites exercise production; isolation suites explicitly
    // cover nonproduction, unknown and absent deployment identity.
    env: {
      RT_DEPLOY_ENV: "production",
      NEXT_PUBLIC_RT_DEPLOY_ENV: "production",
    },
    environment: "happy-dom",
    globals: true,
  },
});
