import { Page } from '@playwright/test';
import { AppAdapter, BootstrapUser } from './types';
import { getVue3RealWorldLocators, getVue3RealWorldOracle } from '../locators/apps/vue3-realworld.locators';
import { vue3RealWorldPaths } from './vue3-realworld-example-app.routes';

async function bootstrapAuthenticatedSession(page: Page, user: BootstrapUser): Promise<void> {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'load' });
  await page.evaluate((currentUser: BootstrapUser) => {
    window.localStorage.setItem('user', JSON.stringify(currentUser));
  }, user);
  await page.reload({ waitUntil: 'load' });
}

export const vue3RealWorldAdapter: AppAdapter = {
  id: 'vue3-realworld-example-app',
  displayName: 'Vue 3 RealWorld Example App',
  rootDir: 'apps/vue3-realworld-example-app',
  startCommand: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
  baseURL: 'http://127.0.0.1:4173',
  healthUrl: 'http://127.0.0.1:4173',
  testMatch: ['tests/realworld/**/*.spec.ts', 'tests/realworld-validation/**/*.spec.ts'],
  env: {
    VITE_API_HOST: 'https://api.realworld.show',
  },
  paths: vue3RealWorldPaths,
  getLocators: getVue3RealWorldLocators,
  getOracle: getVue3RealWorldOracle,
  bootstrapAuthenticatedSession,
};
