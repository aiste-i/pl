import { getSelectedAppAdapter } from '../../../src/apps';
import type { StrategyName } from '../../../src/locators';
import type { Page } from '@playwright/test';

export const appAdapter = getSelectedAppAdapter();
export const appPaths = appAdapter.paths;

export function getAppRawLocators(strategy: StrategyName = 'semantic-first') {
  return appAdapter.getLocators(strategy);
}

export function getAppRawOracle() {
  return appAdapter.getOracle();
}

export function bindAppLocators(page: Page, strategy: StrategyName = 'semantic-first'): any {
  const rawLocators = getAppRawLocators(strategy);

  const bindNode = (node: any): any => {
    if (typeof node === 'function') {
      return (...args: any[]) => ({ raw: node(page, ...args), fill: (value: string) => node(page, ...args).fill(value), click: () => node(page, ...args).click(), press: (key: string) => node(page, ...args).press(key) });
    }
    if (!node || typeof node !== 'object') {
      return node;
    }
    return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, bindNode(value)]));
  };

  return bindNode(rawLocators);
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function pathRegex(pathname: string): RegExp {
  return new RegExp(`${escapeRegExp(pathname)}$`);
}

export function hrefSelector(pathname: string): string {
  const escaped = pathname.replace(/"/g, '\\"');
  return `a[href="${escaped}"], a[href*="${escaped}"]`;
}
