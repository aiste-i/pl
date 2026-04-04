import { Page } from '@playwright/test';
import { AppAdapter, BootstrapUser } from './types';
import { getAngularRealWorldLocators, getAngularRealWorldOracle } from '../locators/apps/angular-realworld.locators';

async function bootstrapAuthenticatedSession(page: Page, user: BootstrapUser): Promise<void> {
  await page.goto('http://127.0.0.1:4200', { waitUntil: 'load' });
  await page.evaluate((token: string) => {
    window.localStorage.setItem('jwtToken', token);
  }, user.token);
  await page.reload({ waitUntil: 'load' });
}

export const angularRealWorldAdapter: AppAdapter = {
  id: 'angular-realworld-example-app',
  displayName: 'Angular RealWorld Example App',
  rootDir: 'apps/angular-realworld-example-app',
  startCommand: 'npm run start -- --host 127.0.0.1 --port 4200',
  baseURL: 'http://127.0.0.1:4200',
  healthUrl: 'http://127.0.0.1:4200',
  testMatch: ['tests/realworld/**/*.spec.ts', 'tests/realworld-validation/**/*.spec.ts'],
  paths: {
    home: () => '/',
    login: () => '/login',
    register: () => '/register',
    settings: () => '/settings',
    editor: (slug?: string) => (slug ? `/editor/${slug}` : '/editor'),
    article: (slug: string) => `/article/${slug}`,
    profile: (username: string) => `/profile/${username}`,
    profileFavorites: (username: string) => `/profile/${username}/favorites`,
    tag: (tag: string, page?: number) => (page && page > 1 ? `/tag/${tag}?page=${page}` : `/tag/${tag}`),
    followingFeed: (page?: number) => (page && page > 1 ? '/?feed=following&page=' + page : '/?feed=following'),
  },
  getLocators: getAngularRealWorldLocators,
  getOracle: getAngularRealWorldOracle,
  bootstrapAuthenticatedSession,
};
