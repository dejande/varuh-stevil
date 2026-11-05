import { defineConfig } from '@playwright/test';

const PORT = 4317;
const HOST = '127.0.0.1';

/** End-to-end tests run against the production build, served at the GitHub Pages base path. */
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://${HOST}:${PORT}/varuh-stevil/`,
    // Locally use the installed Chrome; CI installs Playwright's Chromium.
    channel: process.env.CI ? undefined : 'chrome',
    serviceWorkers: 'block',
    viewport: { width: 1024, height: 768 },
  },
  projects: [
    { name: 'desktop', use: {} },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: {
    command: `npx vite preview --host ${HOST} --port ${PORT} --strictPort`,
    url: `http://${HOST}:${PORT}/varuh-stevil/`,
    // Never reuse: a preview server started before a rebuild serves stale asset lists.
    reuseExistingServer: false,
  },
});
