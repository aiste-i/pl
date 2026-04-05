import path from 'path';
import type { RealWorldLogicalKey } from '../locators';

export type RealWorldCorpusStatus =
  | 'active'
  | 'excluded-by-design'
  | 'excluded-unsupported-comparability'
  | 'excluded-methodological';

export type RealWorldSourceSpecStatus =
  | 'migrated'
  | 'excluded-by-design'
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

export interface RealWorldSourceSpecDisposition {
  sourceSpec: string;
  status: RealWorldSourceSpecStatus;
  rationale: string;
  activeScenarioIds: string[];
  excludedCoverage: string[];
}

export interface RealWorldCorpusManifest {
  corpusId: string;
  displayName: string;
  entrySpec: string;
  validationFiles: string[];
  scenarios: RealWorldScenarioEntry[];
  sourceSpecs: RealWorldSourceSpecDisposition[];
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
  sourceSpecs: [
    {
      sourceSpec: 'tests/realworld/health.spec.ts',
      status: 'migrated',
      rationale: 'The home-load baseline is fully migrated into the shared benchmark fixture and remains benchmark-active.',
      activeScenarioIds: ['health.home-load'],
      excludedCoverage: [],
    },
    {
      sourceSpec: 'tests/realworld/auth.spec.ts',
      status: 'migrated',
      rationale: 'The thesis-active auth benchmark retains the comparable sign-in task and excludes broader auth-state correctness checks that would compare session policy rather than locator robustness under UI change.',
      activeScenarioIds: ['auth.sign-in-valid'],
      excludedCoverage: [
        'registration and logout product flows',
        'invalid-credential and wrong-password error semantics',
        'session persistence and invalid-token recovery checks',
      ],
    },
    {
      sourceSpec: 'tests/realworld/articles.spec.ts',
      status: 'migrated',
      rationale: 'Comparable article-read and single-control state-change flows were migrated into the shared corpus; authoring and ownership workflows remain outside the thesis-active corpus because they compose many benchmarkable controls into one product-journey outcome.',
      activeScenarioIds: [
        'article.open-from-feed',
        'article.favorite-from-detail',
        'article.preview-description-visibility',
        'article.assert-title',
      ],
      excludedCoverage: [
        'create/edit/delete authoring workflows',
        'multi-field editor-tag manipulation',
        'authorization/ownership-only feature gating',
      ],
    },
    {
      sourceSpec: 'tests/realworld/comments.spec.ts',
      status: 'migrated',
      rationale: 'The shared corpus retains the comparable add-comment and delete-own-comment tasks and excludes broader correctness/edge-case checks that do not add distinct locator-family evidence.',
      activeScenarioIds: ['comments.add-on-article', 'comments.delete-own'],
      excludedCoverage: [
        'long-comment rendering and persistence checks',
        'login-gating correctness',
        'multiple-comment list presentation checks',
      ],
    },
    {
      sourceSpec: 'tests/realworld/navigation.spec.ts',
      status: 'migrated',
      rationale: 'The shared corpus keeps the directly comparable global-feed and pagination tasks; broader route-walk and tag-surface checks are excluded because they are application-navigation correctness checks or depend on backend-specific feed/sidebar behavior.',
      activeScenarioIds: ['feed.open-global-feed', 'navigation.pagination'],
      excludedCoverage: [
        'generic navbar route walking',
        'popular-tag surfacing and tag-filter correctness',
        'profile article-count presentation',
      ],
    },
    {
      sourceSpec: 'tests/realworld/settings.spec.ts',
      status: 'migrated',
      rationale: 'The active corpus benchmarks one controlled profile-update task and excludes orthogonal field-persistence variants whose value is product-correctness coverage rather than additional locator-family evidence.',
      activeScenarioIds: ['settings.update-bio'],
      excludedCoverage: [
        'image-only and multi-field update permutations',
        'navbar/profile persistence follow-up checks',
      ],
    },
    {
      sourceSpec: 'tests/realworld/social.spec.ts',
      status: 'migrated',
      rationale: 'The thesis-active corpus retains the comparable follow-toggle task while excluding broader profile/feed visibility assertions that primarily measure backend content state rather than a controlled locator-family interaction.',
      activeScenarioIds: ['social.follow-unfollow'],
      excludedCoverage: [
        'own-profile and other-profile display checks',
        'favorited-feed and followed-feed content assertions',
        'profile article listing correctness',
      ],
    },
    {
      sourceSpec: 'tests/realworld/error-handling.spec.ts',
      status: 'excluded-by-design',
      rationale: 'This spec focuses on API error handling and resilience semantics rather than controlled locator-family robustness under non-breaking UI change.',
      activeScenarioIds: [],
      excludedCoverage: ['error-surface behavior and failure recovery'],
    },
    {
      sourceSpec: 'tests/realworld/null-fields.spec.ts',
      status: 'excluded-by-design',
      rationale: 'Null-field normalization is backend/data-contract coverage rather than a locator robustness comparison task.',
      activeScenarioIds: [],
      excludedCoverage: ['nullable field rendering and persistence semantics'],
    },
    {
      sourceSpec: 'tests/realworld/url-navigation.spec.ts',
      status: 'excluded-by-design',
      rationale: 'URL-shape and deep-link routing checks validate navigation correctness, not locator-family robustness under injected UI change.',
      activeScenarioIds: [],
      excludedCoverage: ['deep-link and route-shape correctness'],
    },
    {
      sourceSpec: 'tests/realworld/user-fetch-errors.spec.ts',
      status: 'excluded-by-design',
      rationale: 'User-fetch failure handling probes infrastructure and resilience semantics, not the controlled UI-mutation question of the thesis benchmark.',
      activeScenarioIds: [],
      excludedCoverage: ['backend unavailability and auth-fetch recovery'],
    },
    {
      sourceSpec: 'tests/realworld/xss-security.spec.ts',
      status: 'excluded-methodological',
      rationale: 'Security and sanitization checks remain intentionally outside the thesis-active corpus because they address application security guarantees rather than locator robustness.',
      activeScenarioIds: [],
      excludedCoverage: ['XSS and sanitization coverage'],
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

export function getSourceSpecDispositions(): RealWorldSourceSpecDisposition[] {
  return REALWORLD_CORPUS_MANIFEST.sourceSpecs;
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
