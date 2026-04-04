import path from 'path';
import type { RealWorldLogicalKey } from '../locators';

export type RealWorldCorpusStatus =
  | 'active'
  | 'excluded-temporary-migration-debt'
  | 'excluded-unsupported-coverage'
  | 'excluded-methodological';

export type RealWorldScenarioCategory =
  | 'load-visibility'
  | 'authentication'
  | 'content-access'
  | 'state-change';

export interface RealWorldScenarioEntry {
  scenarioId: string;
  displayName: string;
  sourceSpec: string;
  status: RealWorldCorpusStatus;
  reason: string;
  category: RealWorldScenarioCategory;
  requiresAuth: boolean;
  usesSetupData: boolean;
  logicalKeys: RealWorldLogicalKey[];
  aggregateComparisonEligible: boolean;
}

export interface RealWorldCorpusManifest {
  corpusId: string;
  displayName: string;
  entrySpec: string;
  validationFiles: string[];
  scenarios: RealWorldScenarioEntry[];
}

export const REALWORLD_ACTIVE_CORPUS_ID = 'realworld-active';

export const REALWORLD_CORPUS_MANIFEST: RealWorldCorpusManifest = {
  corpusId: REALWORLD_ACTIVE_CORPUS_ID,
  displayName: 'RealWorld Active Benchmark Corpus',
  entrySpec: 'tests/realworld/benchmark-active.spec.ts',
  validationFiles: [
    'tests/realworld/benchmark-active.spec.ts',
    'tests/realworld/benchmark-active.scenarios.ts',
    'tests/realworld/helpers/benchmark-active.ts',
  ],
  scenarios: [
    {
      scenarioId: 'health.home-load',
      displayName: 'Home loads',
      sourceSpec: 'tests/realworld/health.spec.ts',
      status: 'active',
      reason: 'Shared load and visibility verification across all three apps.',
      category: 'load-visibility',
      requiresAuth: false,
      usesSetupData: false,
      logicalKeys: ['nav.brandLink', 'nav.navbar'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'auth.sign-in-valid',
      displayName: 'Sign in with valid credentials',
      sourceSpec: 'tests/realworld/auth.spec.ts',
      status: 'active',
      reason: 'Shared authentication task with non-benchmarked API setup and benchmarked UI sign-in.',
      category: 'authentication',
      requiresAuth: false,
      usesSetupData: true,
      logicalKeys: ['auth.emailInput', 'auth.passwordInput', 'auth.submitButton'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'feed.open-global-feed',
      displayName: 'Open the global feed',
      sourceSpec: 'tests/realworld/navigation.spec.ts',
      status: 'active',
      reason: 'Shared content-access task present in Angular, Svelte, and Vue.',
      category: 'content-access',
      requiresAuth: false,
      usesSetupData: false,
      logicalKeys: ['nav.globalFeedTab'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'article.open-from-feed',
      displayName: 'Open the first article from the feed',
      sourceSpec: 'tests/realworld/articles.spec.ts',
      status: 'active',
      reason: 'Shared article-access task using the dedicated read-more benchmark target rather than unsupported preview-description semantics.',
      category: 'content-access',
      requiresAuth: false,
      usesSetupData: false,
      logicalKeys: ['nav.globalFeedTab', 'home.firstReadMoreLink'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'comments.add-on-article',
      displayName: 'Add a comment on an article',
      sourceSpec: 'tests/realworld/comments.spec.ts',
      status: 'active',
      reason: 'Shared comment-creation task that avoids the known Angular comment-delete semantic gap.',
      category: 'state-change',
      requiresAuth: true,
      usesSetupData: true,
      logicalKeys: ['nav.globalFeedTab', 'home.firstReadMoreLink', 'comments.textarea', 'comments.submitButton'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'settings.update-bio',
      displayName: 'Update user bio in settings',
      sourceSpec: 'tests/realworld/settings.spec.ts',
      status: 'active',
      reason: 'Shared profile/settings update task with authenticated setup isolated from benchmark actions.',
      category: 'state-change',
      requiresAuth: true,
      usesSetupData: true,
      logicalKeys: ['settings.bioInput', 'settings.submitButton'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'article.favorite-from-detail',
      displayName: 'Favorite an article from the detail page',
      sourceSpec: 'tests/realworld/articles.spec.ts',
      status: 'active',
      reason: 'Shared detail-page favorite flow using setup data and direct article routing so the benchmarked interaction stays on the article favorite control.',
      category: 'state-change',
      requiresAuth: true,
      usesSetupData: true,
      logicalKeys: ['article.favoriteButton'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'article.preview-description-visibility',
      displayName: 'Verify article preview description',
      sourceSpec: 'tests/realworld/articles.spec.ts',
      status: 'active',
      reason: 'Shared article-preview visibility flow reached through app-owned tagged feed routing, with semantic-first CSS exceptions explicitly tracked in repo reports.',
      category: 'content-access',
      requiresAuth: false,
      usesSetupData: true,
      logicalKeys: ['home.previewDescription'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'comments.delete-own',
      displayName: 'Delete own comment',
      sourceSpec: 'tests/realworld/comments.spec.ts',
      status: 'active',
      reason: 'Shared comment-deletion flow with article/comment setup handled off-path so the benchmarked interaction remains the delete control itself.',
      category: 'state-change',
      requiresAuth: true,
      usesSetupData: true,
      logicalKeys: ['comments.deleteButton'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'article.assert-title',
      displayName: 'Assert article title through benchmark family',
      sourceSpec: 'tests/realworld/articles.spec.ts',
      status: 'active',
      reason: 'Shared article-title visibility flow reached through direct article routing so the benchmarked locator is the title itself rather than feed navigation.',
      category: 'content-access',
      requiresAuth: false,
      usesSetupData: true,
      logicalKeys: ['article.title'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'navigation.pagination',
      displayName: 'Paginate long feed results',
      sourceSpec: 'tests/realworld/navigation.spec.ts',
      status: 'active',
      reason: 'Shared tag-feed pagination flow with setup data created via API and benchmarked page-navigation interactions.',
      category: 'content-access',
      requiresAuth: true,
      usesSetupData: true,
      logicalKeys: ['home.paginationButton', 'home.paginationItem'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'social.follow-unfollow',
      displayName: 'Follow and unfollow another user',
      sourceSpec: 'tests/realworld/social.spec.ts',
      status: 'active',
      reason: 'Shared profile follow-toggle flow that uses authenticated setup data while keeping the benchmarked interaction on profile controls.',
      category: 'state-change',
      requiresAuth: true,
      usesSetupData: true,
      logicalKeys: ['profile.followButton', 'profile.unfollowButton'],
      aggregateComparisonEligible: true,
    },
    {
      scenarioId: 'security.xss-coverage',
      displayName: 'XSS and sanitization checks',
      sourceSpec: 'tests/realworld/xss-security.spec.ts',
      status: 'excluded-methodological',
      reason: 'Security assertions primarily probe sanitization guarantees rather than locator robustness, so they remain outside the active locator benchmark corpus.',
      category: 'content-access',
      requiresAuth: false,
      usesSetupData: true,
      logicalKeys: ['article.body', 'comments.card'],
      aggregateComparisonEligible: false,
    },
  ],
};

export function getBenchmarkCorpusId(): string | undefined {
  return process.env.BENCHMARK_CORPUS_ID || undefined;
}

export function getBenchmarkEntrySpecAbsolutePath(): string {
  return path.join(process.cwd(), REALWORLD_CORPUS_MANIFEST.entrySpec);
}

export function getActiveScenarioEntries(): RealWorldScenarioEntry[] {
  return REALWORLD_CORPUS_MANIFEST.scenarios.filter(entry => entry.status === 'active');
}

export function getExcludedScenarioEntries(): RealWorldScenarioEntry[] {
  return REALWORLD_CORPUS_MANIFEST.scenarios.filter(entry => entry.status !== 'active');
}

export function getActiveScenarioIds(): string[] {
  return getActiveScenarioEntries().map(entry => entry.scenarioId);
}

export function getActiveSourceSpecs(): string[] {
  return [...new Set(getActiveScenarioEntries().map(entry => entry.sourceSpec))].sort();
}

export function getActiveLogicalKeys(): RealWorldLogicalKey[] {
  return [...new Set(getActiveScenarioEntries().flatMap(entry => entry.logicalKeys))] as RealWorldLogicalKey[];
}
