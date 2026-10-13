import { defineConfig } from "@playwright/test";

import applicationConfig from "./playwright.config";

/** Exercise an already running container without reusing the native test server. */
export default defineConfig({
  ...applicationConfig,
  use: {
    ...applicationConfig.use,
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
  },
  webServer: undefined,
});
