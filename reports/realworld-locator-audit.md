# RealWorld Locator Audit

Date: 2026-04-06

## Scope

This audit covers the benchmark-active RealWorld corpus, the per-app locator factories, the oracle layer, and the validation surface used to keep the thesis benchmark methodologically clean.

Reviewed modules:

- `src/locators/apps/angular-realworld.locators.ts`
- `src/locators/apps/react-realworld.locators.ts`
- `src/locators/apps/vue3-realworld.locators.ts`
- `src/locators/apps/shared-realworld.ts`
- `tests/realworld/benchmark-active.scenarios.ts`
- `tests/realworld/helpers/benchmark-active.ts`
- `tests/realworld/helpers/comments.ts`
- `tests/realworld-validation/LocatorPurity.spec.ts`
- `tests/realworld-validation/OraclePurity.spec.ts`
- `tests/realworld-validation/ActiveCorpus.spec.ts`

## Corpus Status

The benchmark-active RealWorld corpus now has an explicit source-spec disposition matrix. There is no remaining temporary migration-debt state in the thesis-active benchmark.

Migrated source specs:

- `tests/realworld/health.spec.ts`
- `tests/realworld/auth.spec.ts`
- `tests/realworld/articles.spec.ts`
- `tests/realworld/comments.spec.ts`
- `tests/realworld/navigation.spec.ts`
- `tests/realworld/settings.spec.ts`
- `tests/realworld/social.spec.ts`

Excluded source specs:

- `tests/realworld/error-handling.spec.ts` as excluded-by-design
- `tests/realworld/null-fields.spec.ts` as excluded-by-design
- `tests/realworld/url-navigation.spec.ts` as excluded-by-design
- `tests/realworld/user-fetch-errors.spec.ts` as excluded-by-design
- `tests/realworld/xss-security.spec.ts` as excluded-methodological

## Oracle Purity Findings

The benchmark-active oracle layer now resolves through `getByTestId()` chains only.

Key changes:

- repeated comment entities are addressed by stable comment-id based test ids rather than visible text
- repeated article preview oracle targets now use stable indexed ids such as `article-preview-1` and `article-read-more-1`
- comment add and delete helpers now discover and track comment ids through oracle roots
- nested oracle targeting uses chained `getByTestId()` helpers instead of semantic or text narrowing
- runtime oracle safety verifies that mutation selection skips direct oracle nodes, oracle-critical ancestors, and descendants inside oracle-rooted contexts

Forbidden oracle patterns are now statically checked:

- `.filter(...)`
- `.first(...)`, `.nth(...)`, and other index narrowing inside oracle factories
- `getByText(...)`
- semantic fallbacks such as `getByRole(...)` and `getByLabel(...)`
- generic `.locator(...)` inside benchmark-active oracle code

## Locator Hardening Findings

The benchmarked locator families remain separated by construction:

- `semantic-first`
- `css`
- `xpath`

Specific hardening completed in this pass:

- semantic-first `role -> descendant text filter` patterns were replaced with direct accessible-name queries
- article preview containers now expose `role="article"` and stable accessible names across Angular, Svelte, and Vue
- article preview descriptions now expose direct semantic handles instead of CSS-backed exception fallbacks
- pagination items now expose direct listitem names instead of role-plus-filter narrowing
- locator purity validation now fails on AST-detected `filter({ hasText: ... })` and chained `getByText(...)` anti-patterns

Semantic exceptions remain explicit and separately reportable in:

- `reports/realworld-semantic-css-exceptions.json`

The current report contains zero active exceptions.

## Mutation Alignment Findings

Operator presence is no longer the only evidence available. The benchmark now records:

- operator taxonomy
- operator DOM applicability conditions
- operator non-breaking safety guards
- in-scope vs excluded-by-design operator scope
- operator coverage counts
- flattened per-run mutation telemetry including mutated selector, candidate id, and operator category

Visual-only operators are explicit exclusions, not ambiguous leftovers:

- `DistortMutator`
- `MaskMutator`

## Accessibility Aggregation Findings

Accessibility aggregation no longer mixes completed scans and incomplete scans into a single zero-like summary.

The pipeline now emits:

- `accessibility_summary_completed_only.csv`
- `accessibility_summary_all_valid_runs.csv`
- `accessibility_scan_status_summary.csv`

Version-controlled reviewer copies are published in:

- `reports/realworld-accessibility-summary-completed-only.csv`
- `reports/realworld-accessibility-summary-all-valid-runs.csv`
- `reports/realworld-accessibility-scan-status-summary.csv`

This keeps accessibility useful as an analytical support layer without overstating or understating prevalence through hidden scan incompleteness.

## Validation Surface

Methodological validation now includes:

- corpus disposition validation
- locator purity validation
- oracle purity validation
- mutation operator scope validation
- mutation operator non-breaking safety validation
- generated-report validation

## Remaining Explicit Exclusions

The following remain outside the thesis-active corpus by design:

- non-comparable error-handling and backend-contract specs
- deep-link and route-shape correctness specs
- XSS and sanitization coverage

These are explicit scope boundaries, not unfinished migration work.

## Validation Commands

Commands exercised during this pass:

- `npm run lint`
- `npm run typecheck`
- `npm run reports:generate`
- `npm run validate:realworld`

The local validation run uses Chromium as the primary environment. Firefox and WebKit coverage is implemented through dedicated smoke commands and CI workflows.
