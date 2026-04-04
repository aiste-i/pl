import type { APIRequestContext, Page } from '@playwright/test';
import { MutantGenerator } from '../../src/murun/runner/MutantGenerator';
import {
  getActiveScenarioEntries,
  type RealWorldScenarioEntry,
} from '../../src/benchmark/realworld-corpus';
import { appPaths } from './helpers/app';
import {
  addCommentToOpenedArticle,
  deleteOwnCommentFromOpenedArticle,
  followAndUnfollowProfile,
  getActiveBenchmarkTimeoutMs,
  getStableCommentCount,
  openArticleBySlug,
  openFirstArticleFromFeed,
  openGlobalFeed,
  paginateTaggedFeed,
  signInWithValidCredentials,
  updateBioFromSettings,
  verifyOpenedArticleTitle,
  verifyPreviewDescription,
  visitHome,
} from './helpers/benchmark-active';
import {
  provisionAuthenticatedUser,
  provisionAuthCredentials,
} from './helpers/setup-infrastructure';
import {
  getFirstPublicArticleSummary,
} from './helpers/api';

export interface ActiveScenarioFixtures {
  page: Page;
  request: APIRequestContext;
  locators: any;
  oracle: any;
  appAdapter: any;
  applyDeferredMutation(scenarioId: string, viewContext: string): Promise<void>;
}

export interface ActiveScenarioCollectContext extends ActiveScenarioFixtures {
  generator: MutantGenerator;
  collectCheckpoint(viewContext: string): Promise<void>;
}

export interface ActiveScenarioDefinition extends RealWorldScenarioEntry {
  run(fixtures: ActiveScenarioFixtures): Promise<void>;
  collect(fixtures: ActiveScenarioCollectContext): Promise<void>;
}

function ensureScenarioEntry(scenarioId: string): RealWorldScenarioEntry {
  const entry = getActiveScenarioEntries().find(item => item.scenarioId === scenarioId);
  if (!entry) {
    throw new Error(`Active scenario "${scenarioId}" is missing from the corpus manifest.`);
  }
  return entry;
}

export const ACTIVE_SCENARIOS: ActiveScenarioDefinition[] = [
  {
    ...ensureScenarioEntry('health.home-load'),
    async run({ page, oracle, applyDeferredMutation }) {
      await visitHome(page, oracle);
      await applyDeferredMutation('health.home-load', 'home');
      await oracle.nav.navbar().assertVisible();
    },
    async collect({ page, oracle, collectCheckpoint }) {
      await visitHome(page, oracle);
      await collectCheckpoint('home');
    },
  },
  {
    ...ensureScenarioEntry('auth.sign-in-valid'),
    async run({ page, request, locators, oracle, applyDeferredMutation }) {
      const provisioned = await provisionAuthCredentials(request);
      await page.goto(appPaths.login(), { waitUntil: 'load' });
      await oracle.auth.title().assertContainsText(/sign in/i, { timeout: getActiveBenchmarkTimeoutMs() });
      await applyDeferredMutation('auth.sign-in-valid', 'login-form');
      await signInWithValidCredentials(page, locators, oracle, provisioned.credentials.email, provisioned.credentials.password, { navigateToLogin: false });
    },
    async collect({ page, request, locators, oracle, collectCheckpoint }) {
      const provisioned = await provisionAuthCredentials(request);
      await page.goto(appPaths.login(), { waitUntil: 'load' });
      await oracle.auth.title().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await collectCheckpoint('login-form');
      await signInWithValidCredentials(page, locators, oracle, provisioned.credentials.email, provisioned.credentials.password);
    },
  },
  {
    ...ensureScenarioEntry('feed.open-global-feed'),
    async run({ page, locators, oracle, applyDeferredMutation }) {
      await visitHome(page, oracle);
      await applyDeferredMutation('feed.open-global-feed', 'home-before-global-feed');
      await locators.nav.globalFeedTab().click();
      await oracle.home.firstReadMoreLink().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
    },
    async collect({ page, locators, oracle, collectCheckpoint }) {
      await visitHome(page, oracle);
      await collectCheckpoint('home-before-global-feed');
    },
  },
  {
    ...ensureScenarioEntry('article.open-from-feed'),
    async run({ page, locators, oracle, applyDeferredMutation }) {
      await openGlobalFeed(page, locators, oracle);
      await applyDeferredMutation('article.open-from-feed', 'global-feed-before-open');
      await Promise.all([
        page.waitForURL(/\/article\/.+/),
        locators.home.firstReadMoreLink().click(),
      ]);
      await oracle.article.page().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
    },
    async collect({ page, locators, oracle, collectCheckpoint }) {
      await openGlobalFeed(page, locators, oracle);
      await collectCheckpoint('global-feed-before-open');
    },
  },
  {
    ...ensureScenarioEntry('article.favorite-from-detail'),
    async run({ page, request, appAdapter, locators, oracle, applyDeferredMutation }) {
      await provisionAuthenticatedUser(page, request, appAdapter);
      const article = await getFirstPublicArticleSummary(request);
      await openArticleBySlug(page, oracle, article.slug);
      await oracle.article.favoriteButton().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await applyDeferredMutation('article.favorite-from-detail', 'article-detail-before-favorite');
      await locators.article.favoriteButton().click();
      await oracle.article.unfavoriteButton().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
    },
    async collect({ page, request, appAdapter, oracle, collectCheckpoint }) {
      await provisionAuthenticatedUser(page, request, appAdapter);
      const article = await getFirstPublicArticleSummary(request);
      await openArticleBySlug(page, oracle, article.slug);
      await oracle.article.favoriteButton().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await collectCheckpoint('article-detail-before-favorite');
    },
  },
  {
    ...ensureScenarioEntry('article.preview-description-visibility'),
    async run({ page, locators, oracle, applyDeferredMutation }) {
      await openGlobalFeed(page, locators, oracle);
      await oracle.home.firstArticlePreview().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await applyDeferredMutation('article.preview-description-visibility', 'global-feed-before-preview-description');
      await verifyPreviewDescription(locators, oracle, /\S+/);
    },
    async collect({ page, locators, oracle, collectCheckpoint }) {
      await openGlobalFeed(page, locators, oracle);
      await oracle.home.firstArticlePreview().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await collectCheckpoint('global-feed-before-preview-description');
    },
  },
  {
    ...ensureScenarioEntry('navigation.pagination'),
    async run({ page, locators, oracle, applyDeferredMutation }) {
      await openGlobalFeed(page, locators, oracle);
      await oracle.home.paginationButton(2).assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await applyDeferredMutation('navigation.pagination', 'global-feed-before-pagination');
      await paginateTaggedFeed(locators, oracle, 2);
    },
    async collect({ page, locators, oracle, collectCheckpoint }) {
      await openGlobalFeed(page, locators, oracle);
      await oracle.home.paginationButton(2).assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await collectCheckpoint('global-feed-before-pagination');
    },
  },
  {
    ...ensureScenarioEntry('comments.delete-own'),
    async run({ page, request, appAdapter, locators, oracle, applyDeferredMutation }) {
      await provisionAuthenticatedUser(page, request, appAdapter);
      const article = await getFirstPublicArticleSummary(request);
      const commentText = `Benchmark delete comment ${Date.now()}`;
      await openArticleBySlug(page, oracle, article.slug);
      const initialCommentCount = await getStableCommentCount(oracle);
      await addCommentToOpenedArticle(locators, oracle, commentText);
      await applyDeferredMutation('comments.delete-own', 'article-detail-before-comment-delete');
      await deleteOwnCommentFromOpenedArticle(locators, oracle, initialCommentCount);
    },
    async collect({ page, request, appAdapter, locators, oracle, collectCheckpoint }) {
      await provisionAuthenticatedUser(page, request, appAdapter);
      const article = await getFirstPublicArticleSummary(request);
      const commentText = `Benchmark delete comment ${Date.now()}`;
      await openArticleBySlug(page, oracle, article.slug);
      await addCommentToOpenedArticle(locators, oracle, commentText);
      await collectCheckpoint('article-detail-before-comment-delete');
    },
  },
  {
    ...ensureScenarioEntry('comments.add-on-article'),
    async run({ page, request, appAdapter, locators, oracle, applyDeferredMutation }) {
      await provisionAuthenticatedUser(page, request, appAdapter);
      await openFirstArticleFromFeed(page, locators, oracle);
      await applyDeferredMutation('comments.add-on-article', 'article-detail-before-comment');
      await addCommentToOpenedArticle(locators, oracle, `Benchmark comment ${Date.now()}`);
    },
    async collect({ page, request, appAdapter, locators, oracle, collectCheckpoint }) {
      await provisionAuthenticatedUser(page, request, appAdapter);
      await openFirstArticleFromFeed(page, locators, oracle);
      await collectCheckpoint('article-detail-before-comment');
    },
  },
  {
    ...ensureScenarioEntry('article.assert-title'),
    async run({ page, request, locators, oracle, applyDeferredMutation }) {
      const article = await getFirstPublicArticleSummary(request);
      await openArticleBySlug(page, oracle, article.slug);
      await applyDeferredMutation('article.assert-title', 'article-detail-before-title-assert');
      await verifyOpenedArticleTitle(locators, oracle, article.title);
    },
    async collect({ page, request, oracle, collectCheckpoint }) {
      const article = await getFirstPublicArticleSummary(request);
      await openArticleBySlug(page, oracle, article.slug);
      await collectCheckpoint('article-detail-before-title-assert');
    },
  },
  {
    ...ensureScenarioEntry('social.follow-unfollow'),
    async run({ page, request, appAdapter, locators, oracle, applyDeferredMutation }) {
      await provisionAuthenticatedUser(page, request, appAdapter);
      const article = await getFirstPublicArticleSummary(request);
      await page.goto(appPaths.profile(article.authorUsername), { waitUntil: 'load' });
      await oracle.profile.page().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await oracle.profile.followButton().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await applyDeferredMutation('social.follow-unfollow', 'profile-before-follow-toggle');
      await followAndUnfollowProfile(locators, oracle);
    },
    async collect({ page, request, appAdapter, oracle, collectCheckpoint }) {
      await provisionAuthenticatedUser(page, request, appAdapter);
      const article = await getFirstPublicArticleSummary(request);
      await page.goto(appPaths.profile(article.authorUsername), { waitUntil: 'load' });
      await oracle.profile.page().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await oracle.profile.followButton().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await collectCheckpoint('profile-before-follow-toggle');
    },
  },
  {
    ...ensureScenarioEntry('settings.update-bio'),
    async run({ page, request, appAdapter, locators, oracle, applyDeferredMutation }) {
      const provisioned = await provisionAuthenticatedUser(page, request, appAdapter);
      await page.goto(appPaths.settings(), { waitUntil: 'load' });
      await oracle.settings.page().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await applyDeferredMutation('settings.update-bio', 'settings-form');
      await updateBioFromSettings(page, locators, oracle, `Bio updated ${Date.now()}`, {
        navigateToSettings: false,
        profileUsername: provisioned.credentials.username,
      });
    },
    async collect({ page, request, appAdapter, locators, oracle, collectCheckpoint }) {
      await provisionAuthenticatedUser(page, request, appAdapter);
      await page.goto(appPaths.settings(), { waitUntil: 'load' });
      await oracle.settings.page().assertVisible({ timeout: getActiveBenchmarkTimeoutMs() });
      await collectCheckpoint('settings-form');
    },
  },
];

export function getActiveScenarioDefinitions(): ActiveScenarioDefinition[] {
  return ACTIVE_SCENARIOS;
}
