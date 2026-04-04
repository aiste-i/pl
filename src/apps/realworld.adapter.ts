import { Page } from '@playwright/test';
import { AppAdapter, BootstrapUser } from './types';
import { getReactRealWorldLocators, getReactRealWorldOracle } from '../locators/apps/react-realworld.locators';
import { realworldPaths } from './realworld.routes';

async function bootstrapAuthenticatedSession(page: Page, user: BootstrapUser): Promise<void> {
  const cookieValue = Buffer.from(
    JSON.stringify({
      username: user.username,
      email: user.email,
      token: user.token,
      bio: user.bio ?? null,
      image: user.image ?? null,
    }),
    'utf8',
  ).toString('base64');

  await page.context().addCookies([
    {
      name: 'jwt',
      value: cookieValue,
      url: 'http://127.0.0.1:4174',
    },
  ]);
  await page.goto('http://127.0.0.1:4174', { waitUntil: 'load' });
}

export const realworldAdapter: AppAdapter = {
  id: 'realworld',
  displayName: 'Svelte RealWorld',
  rootDir: 'apps/realworld',
  startCommand: 'npm run dev -- --host 127.0.0.1 --port 4174',
  baseURL: 'http://127.0.0.1:4174',
  healthUrl: 'http://127.0.0.1:4174',
  testMatch: ['tests/realworld/**/*.spec.ts', 'tests/realworld-validation/**/*.spec.ts'],
  paths: realworldPaths,
  getLocators: getReactRealWorldLocators,
  getOracle: getReactRealWorldOracle,
  bootstrapAuthenticatedSession,
};
