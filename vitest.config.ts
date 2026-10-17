import path from "path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      config: path.resolve(__dirname, "./config"),
    },
  },
  test: {
    // Playwright owns e2e/; keep Vitest from collecting its *.spec.ts files.
    exclude: [...configDefaults.exclude, "e2e/**"],
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
