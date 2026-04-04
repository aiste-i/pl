import type { Page } from '@playwright/test';
import { expect } from '../../baseFixture';
import { appPaths } from './app';

export function getActiveBenchmarkTimeoutMs(): number {
  return process.env.APP_ID === 'vue3-realworld-example-app' ? 30000 : 10000;
}

export async function visitHome(page: Page, oracle: any): Promise<void> {
  await page.goto(appPaths.home(), { waitUntil: 'load' });
  await oracle.nav.brandLink().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
  await oracle.nav.navbar().assertVisible();
}

export async function signInWithValidCredentials(
  page: Page,
  locators: any,
  oracle: any,
  email: string,
  password: string,
  options: { navigateToLogin?: boolean } = {},
): Promise<void> {
  if (options.navigateToLogin !== false) {
    await page.goto(appPaths.login(), { waitUntil: 'load' });
    await oracle.auth.title().assertContainsText(/sign in/i, { timeout: getActiveBenchmarkTimeoutMs() });
  }
  await locators.auth.emailInput().fill(email);
  await locators.auth.passwordInput().fill(password);
  await locators.auth.submitButton().click();
  await page.waitForURL(url => !url.toString().includes('/login'), { waitUntil: 'commit', timeout: 5000 }).catch(() => undefined);
  await oracle.nav.profileLink().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
}

export async function openGlobalFeed(page: Page, locators: any, oracle: any): Promise<void> {
  await visitHome(page, oracle);
  await locators.nav.globalFeedTab().click();
  await oracle.home.firstReadMoreLink().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
}

export async function openTaggedFeed(
  page: Page,
  oracle: any,
  tag: string,
  options: { expectedPage?: number } = {},
): Promise<void> {
  await page.goto(appPaths.tag(tag, options.expectedPage), { waitUntil: 'load' });
  await oracle.home.paginationButton(2).assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
}

export async function openFirstArticleFromFeed(page: Page, locators: any, oracle: any): Promise<void> {
  await openGlobalFeed(page, locators, oracle);
  await Promise.all([
    page.waitForURL(/\/article\/.+/),
    locators.home.firstReadMoreLink().click(),
  ]);
  await oracle.article.page().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
}

export async function favoriteOpenedArticle(page: Page, locators: any, oracle: any): Promise<void> {
  await locators.article.favoriteButton().click();
  await oracle.article.unfavoriteButton().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
}

export async function addCommentToOpenedArticle(
  locators: any,
  oracle: any,
  commentText: string,
): Promise<void> {
  await locators.comments.textarea().fill(commentText);
  await locators.comments.submitButton().click();
  await oracle.comments.card(commentText).assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
}

export async function updateBioFromSettings(
  page: Page,
  locators: any,
  oracle: any,
  bio: string,
  options: { navigateToSettings?: boolean; profileUsername?: string } = {},
): Promise<void> {
  if (options.navigateToSettings !== false) {
    await page.goto(appPaths.settings(), { waitUntil: 'load' });
    await oracle.settings.page().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
  }
  await locators.settings.bioInput().fill(bio);
  await locators.settings.submitButton().click();
  const navigatedAway = await page
    .waitForURL(url => !url.toString().includes('/settings'), { waitUntil: 'commit', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
  if (options.profileUsername && !navigatedAway) {
    await page.goto(appPaths.profile(options.profileUsername), { waitUntil: 'load' });
  }
  await oracle.profile.bio().assertContainsText(bio, { timeout: getActiveBenchmarkTimeoutMs() });
  if (options.profileUsername) {
    await expect(page).toHaveURL(new RegExp(options.profileUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
}

export async function paginateTaggedFeed(
  locators: any,
  oracle: any,
  pageNumber: number,
): Promise<void> {
  await locators.home.paginationButton(pageNumber).click();
  await oracle.home.paginationItem(pageNumber).assertClass(/active/, { timeout: getActiveBenchmarkTimeoutMs() });
}

export async function followAndUnfollowProfile(
  locators: any,
  oracle: any,
): Promise<void> {
  await locators.profile.followButton().click();
  await oracle.profile.unfollowButton().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
  await locators.profile.unfollowButton().click();
  await oracle.profile.followButton().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
}
