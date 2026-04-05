import type { Page } from '@playwright/test';
import { expect } from '../../baseFixture';
import { appPaths } from './app';

export function getActiveBenchmarkTimeoutMs(): number {
  return process.env.APP_ID === 'vue3-realworld-example-app' ? 30000 : 10000;
}

export async function getStableCommentIds(oracle: any): Promise<number[]> {
  const ids = await oracle.comments.cards().raw.evaluateAll(cards =>
    cards
      .map(card => {
        const nested = card.querySelector('[data-testid^="comment-card-"]');
        const value = nested?.getAttribute('data-testid') ?? null;
        const match = value ? /^comment-card-(\d+)$/.exec(value) : null;
        return match ? Number(match[1]) : null;
      })
      .filter((id): id is number => typeof id === 'number'),
  );

  return ids.sort((left, right) => left - right);
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
  options: { expectedPage?: number; expectedPaginationButton?: number | null } = {},
): Promise<void> {
  await page.goto(appPaths.tag(tag, options.expectedPage), { waitUntil: 'load' });
  const expectedPaginationButton = options.expectedPaginationButton === undefined ? 2 : options.expectedPaginationButton;
  if (expectedPaginationButton === null) {
    await oracle.home.firstArticlePreview().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
    return;
  }
  await oracle.home.paginationButton(expectedPaginationButton).assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
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

export async function openArticleBySlug(
  page: Page,
  oracle: any,
  slug: string,
): Promise<void> {
  await page.goto(appPaths.article(slug), { waitUntil: 'load' });
  await oracle.article.page().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
}

export async function verifyPreviewDescription(
  locators: any,
  oracle: any,
  expectedDescription: string | RegExp,
): Promise<void> {
  const previewRoot = oracle.home.firstArticlePreview().raw;
  await locators.home.previewDescription(previewRoot).waitFor({
    state: 'visible',
    timeout: getActiveBenchmarkTimeoutMs(),
  });
  await oracle.home.previewDescription(previewRoot).assertContainsText(expectedDescription, {
    timeout: getActiveBenchmarkTimeoutMs(),
  });
}

export async function verifyOpenedArticleTitle(
  locators: any,
  oracle: any,
  expectedTitle: string,
): Promise<void> {
  await locators.article.title().waitFor({
    state: 'visible',
    timeout: getActiveBenchmarkTimeoutMs(),
  });
  await oracle.article.title().assertContainsText(expectedTitle, {
    timeout: getActiveBenchmarkTimeoutMs(),
  });
}

export async function getStableCommentCount(
  oracle: any,
  options: { timeoutMs?: number; intervalMs?: number; stableSamples?: number } = {},
): Promise<number> {
  const timeoutMs = options.timeoutMs ?? getActiveBenchmarkTimeoutMs();
  const intervalMs = options.intervalMs ?? 100;
  const stableSamples = options.stableSamples ?? 3;
  const deadline = Date.now() + timeoutMs;

  let lastCount = -1;
  let stableCount = 0;

  while (Date.now() < deadline) {
    const currentCount = await oracle.comments.cards().raw.count();
    if (currentCount === lastCount) {
      stableCount += 1;
      if (stableCount >= stableSamples) {
        return currentCount;
      }
    } else {
      lastCount = currentCount;
      stableCount = 1;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  return lastCount;
}

export async function addCommentToOpenedArticle(
  locators: any,
  oracle: any,
  commentText: string,
): Promise<number> {
  const initialCommentIds = await getStableCommentIds(oracle);
  await locators.comments.textarea().fill(commentText);
  await locators.comments.submitButton().click();

  const deadline = Date.now() + getActiveBenchmarkTimeoutMs();
  let createdCommentId: number | null = null;
  while (Date.now() < deadline) {
    const currentIds = await getStableCommentIds(oracle);
    createdCommentId = currentIds.find(id => !initialCommentIds.includes(id)) ?? null;
    if (createdCommentId !== null) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  expect(createdCommentId, 'Expected the UI to render a new comment card id after posting').not.toBeNull();

  await oracle.comments.cardById(createdCommentId!).assertVisible({
    timeout: getActiveBenchmarkTimeoutMs(),
  });

  return createdCommentId!;
}

export async function deleteOwnCommentFromOpenedArticle(
  locators: any,
  oracle: any,
  commentId: number,
  expectedCommentCountAfterDelete: number,
): Promise<void> {
  const commentCards = oracle.comments.cards();
  const commentCard = oracle.comments.cardById(commentId);
  await locators.comments.deleteButton(commentCard).click();
  await commentCards.assertCount(expectedCommentCountAfterDelete, {
    timeout: getActiveBenchmarkTimeoutMs(),
  });
  await expect
    .poll(() => oracle.comments.cardById(commentId).raw.count(), {
      timeout: getActiveBenchmarkTimeoutMs(),
    })
    .toBe(0);
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
