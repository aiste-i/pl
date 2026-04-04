# RealWorld Locator Audit

Date: 2026-04-04

## Scope

This audit reviewed the active RealWorld benchmark corpus and the supporting locator/oracle infrastructure for:

- Angular: `src/locators/apps/angular-realworld.locators.ts`
- Svelte (`realworld`): `src/locators/apps/react-realworld.locators.ts`
- Vue: `src/locators/apps/vue3-realworld.locators.ts`
- Active benchmark scenarios and helpers:
  - `tests/realworld/benchmark-active.scenarios.ts`
  - `tests/realworld/helpers/benchmark-active.ts`
- App-side oracle hooks used by the benchmarked flows in:
  - `apps/angular-realworld-example-app/...`
  - `apps/realworld/...`
  - `apps/vue3-realworld-example-app/...`

The XSS/sanitization spec remains excluded by methodology and was not migrated into the active locator benchmark.

## Active Corpus Inventory

Active benchmark scenarios reviewed from `src/benchmark/realworld-corpus.ts`:

- `health.home-load`
- `auth.sign-in-valid`
- `feed.open-global-feed`
- `article.open-from-feed`
- `article.favorite-from-detail`
- `article.preview-description-visibility`
- `navigation.pagination`
- `comments.delete-own`
- `comments.add-on-article`
- `article.assert-title`
- `social.follow-unfollow`
- `settings.update-bio`

Active logical benchmark keys reviewed:

- `nav.brandLink`
- `nav.navbar`
- `nav.globalFeedTab`
- `auth.emailInput`
- `auth.passwordInput`
- `auth.submitButton`
- `home.firstReadMoreLink`
- `home.previewDescription`
- `home.paginationButton`
- `home.paginationItem`
- `article.title`
- `article.favoriteButton`
- `comments.textarea`
- `comments.submitButton`
- `comments.deleteButton`
- `profile.followButton`
- `profile.unfollowButton`
- `settings.bioInput`
- `settings.submitButton`

## Findings And Fixes

### Fixed

- Svelte CSS/XPath `globalFeedTab` locators were pointing at `href="/"` instead of the actual `href="/?tab=all"` feed link. Updated in `src/locators/apps/react-realworld.locators.ts`.
- Svelte favorite/follow buttons did not reliably expose post-click state, so `Favorite -> Unfavorite` and `Follow -> Unfollow` assertions could not observe the UI change. Reworked optimistic state handling in:
  - `apps/realworld/src/routes/article/[slug]/ArticleMeta.svelte`
  - `apps/realworld/src/lib/ArticleList/ArticlePreview.svelte`
  - `apps/realworld/src/routes/profile/@[user]/+layout.svelte`
- Svelte favorite action did not await backend calls. Fixed in `apps/realworld/src/routes/article/[slug]/+page.server.js`.
- Svelte and Vue pagination depended on a page size of `10`, which no longer guarantees a visible page `2` on the current live corpus. Reduced benchmark-relevant page size to `2` in:
  - `apps/realworld/src/lib/constants.js`
  - `apps/vue3-realworld-example-app/src/services/index.ts`
- Vue detail-page favorite oracle was ambiguous because both top and bottom article meta sections exposed the same favorite test ids. Fixed by:
  - scoping benchmark CSS/XPath locators to the banner/top meta region
  - scoping oracle lookups to `getByTestId('article-meta-top').getByTestId(...)`
- Oracle validation originally allowed only a single `getByTestId(...)` call string. Relaxed to allow chained `getByTestId(...).getByTestId(...)` while still forbidding non-test-id oracle roots in `tests/realworld-validation/LocatorPurity.spec.ts`.
- Active benchmark comment assertions previously narrowed generic `getByTestId('comment-card')` with text filters. The active benchmark now uses pure test-id rooted assertions:
  - count-based comment creation checks
  - delete flow driven through benchmark delete controls
  - optional id-addressed comment hooks added in app DOM for future targeted oracle use
- Added stable comment wrapper/id hooks in all three apps:
  - Angular: `apps/angular-realworld-example-app/src/app/features/article/components/article-comment.component.ts`
  - Svelte: `apps/realworld/src/routes/article/[slug]/Comment.svelte`
  - Vue: `apps/vue3-realworld-example-app/src/components/ArticleDetailComment.vue`
- Vue `comments.delete-own` was brittle when it depended on API-seeded comments or fresh API-created articles becoming visible immediately. The scenario now creates the deletable comment through the UI on an existing public article, keeping the benchmark focused on the actual delete interaction.

### Intentional Exceptions

- `home.previewDescription` remains a semantic-first CSS-backed exception in all three apps because the preview description does not expose a stable semantic-only entry point. These exceptions are tracked in `reports/realworld-semantic-css-exceptions.json`.
- The XSS corpus entry remains excluded for methodological reasons because it evaluates sanitization/security behavior rather than locator robustness.

## Oracle Status

Active benchmark oracle assertions now rely on `getByTestId()` roots only.

Allowed oracle shape after this audit:

- `getByTestId('...')`
- `getByTestId('...').getByTestId('...')`

Disallowed in active benchmark oracle assertions:

- text-filtered oracle roots
- CSS/XPath oracle roots
- `page.locator(...)` oracle roots
- semantic-oracle fallbacks

## Legacy Non-Benchmark Hotspots

The active benchmark corpus is now centrally enforced, but legacy `tests/realworld/*.spec.ts` files still contain direct selectors that are not yet normalized onto the benchmark locator/oracle interface. The heaviest remaining hotspots are:

- `tests/realworld/error-handling.spec.ts`
- `tests/realworld/user-fetch-errors.spec.ts`
- `tests/realworld/url-navigation.spec.ts`
- `tests/realworld/social.spec.ts`
- `tests/realworld/auth.spec.ts`
- `tests/realworld/navigation.spec.ts`
- `tests/realworld/settings.spec.ts`

Common residual legacy patterns:

- `page.locator(...)` assertions against CSS classes
- text-based CSS selectors such as `button:has-text(...)`
- direct href/class assertions outside app-owned locator modules
- generic comment lookup by visible text in legacy comment specs

These files remain useful as broader feature tests, but they are not yet subject to the same strict purity/oracle guarantees as the active benchmark corpus.

## Verification

Validation:

- `npx playwright test tests/realworld-validation/LocatorPurity.spec.ts tests/realworld-validation/LocatorCoverage.spec.ts`

Runtime:

- `PLAYWRIGHT_BROWSERS=chromium npm run benchmark:baseline:app --appid=angular-realworld-example-app`
- `PLAYWRIGHT_BROWSERS=chromium npm run benchmark:baseline:app --appid=realworld`
- `PLAYWRIGHT_BROWSERS=chromium npm run benchmark:baseline:app --appid=vue3-realworld-example-app`
- `PLAYWRIGHT_BROWSERS=chromium npm run benchmark:baseline:all`

Result:

- Active benchmark baseline is green for Angular, Svelte, and Vue in Chromium.
