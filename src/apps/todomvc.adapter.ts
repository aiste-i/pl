import { AppAdapter } from './types';
import { getTodoMVCLocators, getTodoMVCOracle } from '../locators/apps/todomvc.locators';

export const todoMvcAdapter: AppAdapter = {
  id: 'todomvc',
  displayName: 'TodoMVC Legacy Pilot',
  rootDir: 'apps/react',
  startCommand: 'npm run serve',
  baseURL: 'http://127.0.0.1:7002',
  healthUrl: 'http://127.0.0.1:7002',
  testMatch: ['tests/todomvc/**/*.spec.ts', 'tests/AccessibilityIntegration.spec.ts', 'tests/ClassifierValidation.spec.ts'],
  paths: {
    home: () => '/',
    login: () => '/',
    register: () => '/',
    settings: () => '/',
    editor: () => '/',
    article: () => '/',
    profile: () => '/',
    profileFavorites: () => '/',
    tag: () => '/',
    followingFeed: () => '/',
  },
  getLocators: getTodoMVCLocators,
  getOracle: getTodoMVCOracle,
};
