import { Page } from '@playwright/test';
import { AppAdapter, BootstrapUser } from './types';
import { getReactRealWorldLocators, getReactRealWorldOracle } from '../locators/apps/react-realworld.locators';

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
  paths: {
    home: () => '/',
    login: () => '/login',
    register: () => '/register',
    settings: () => '/settings',
    editor: (slug?: string) => (slug ? `/editor/${slug}` : '/editor'),
    article: (slug: string) => `/article/${slug}`,
    profile: (username: string) => `/profile/@${username}`,
    profileFavorites: (username: string) => `/profile/@${username}/favorites`,
    tag: (tag: string, page?: number) => {
      const params = new URLSearchParams({ tag });
      if (page && page > 1) params.set('page', String(page));
      return `/?${params.toString()}`;
    },
    followingFeed: (page?: number) => {
      const params = new URLSearchParams({ tab: 'feed' });
      if (page && page > 1) params.set('page', String(page));
      return `/?${params.toString()}`;
    },
  },
  getLocators: getReactRealWorldLocators,
  getOracle: getReactRealWorldOracle,
  bootstrapAuthenticatedSession,
};
