import { defineConfig, devices } from '@playwright/test';
import { getSelectedAppAdapter } from './src/apps';

const adapter = getSelectedAppAdapter();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  testMatch: adapter.testMatch,
  outputDir: `test-results/${adapter.id}/playwright-artifacts`,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    baseURL: adapter.baseURL,
    navigationTimeout: 15_000,
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: `${adapter.id}-chromium`,
      metadata: {
        appId: adapter.id,
        appDisplayName: adapter.displayName,
      },
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: adapter.startCommand,
    cwd: adapter.rootDir,
    url: adapter.healthUrl,
    env: {
      ...process.env,
      ...(adapter.env ?? {}),
    },
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 180_000,
  },
});
