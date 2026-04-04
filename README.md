# Playwright RealWorld Mutation Benchmark

This repository benchmarks Playwright locator-family robustness across three RealWorld applications:

- `angular-realworld-example-app`
- `realworld`
- `vue3-realworld-example-app`

The benchmark comparison model is fixed to:

- `semantic-first`
- `css`
- `xpath`

Oracle locators stay separate and use `data-testid` only.

## Current Executable Scope

The repository now runs an end-to-end benchmark pipeline for the current benchmark-active shared corpus:

- corpus id: `realworld-active`
- executable entry spec: `tests/realworld/benchmark-active.spec.ts`
- active source spec intent:
  - `tests/realworld/health.spec.ts`
  - `tests/realworld/auth.spec.ts`
  - `tests/realworld/articles.spec.ts`
  - `tests/realworld/comments.spec.ts`
  - `tests/realworld/navigation.spec.ts`
  - `tests/realworld/settings.spec.ts`
  - `tests/realworld/social.spec.ts`

This is an honest scope boundary. Security-oriented XSS coverage remains explicitly excluded on methodological grounds because it probes sanitization guarantees rather than locator robustness. Excluded specs are tracked in:

- `src/benchmark/realworld-corpus.ts`
- `reports/realworld-benchmark-corpus.json`

## App Selection

Select the benchmark subject with `APP_ID`.

Examples:

```bash
cross-env APP_ID=angular-realworld-example-app npx playwright test tests/realworld/benchmark-active.spec.ts
cross-env APP_ID=realworld npx playwright test tests/realworld/benchmark-active.spec.ts
cross-env APP_ID=vue3-realworld-example-app npx playwright test tests/realworld/benchmark-active.spec.ts
```

The app registry under `src/apps/*` defines:

- startup command
- base URL / health URL
- result-path scoping
- route/path helpers for shared RealWorld tests
- per-app locator and oracle factories

## Result Layout

Artifacts are separated by app and corpus:

- `test-results/<app-id>/realworld-active/benchmark-runs`
- `test-results/<app-id>/realworld-active/accessibility-artifacts`
- `test-results/<app-id>/realworld-active/reachable-targets.json`
- `test-results/<app-id>/realworld-active/scenarios.json`
- `test-results/<app-id>/realworld-active/aggregate`

## Coverage And Exclusions

The benchmark keeps locator support and unsupported coverage explicit:

- `reports/realworld-locator-support-matrix.json`
- `reports/realworld-locator-unsupported.json`
- `reports/realworld-pipeline-verification.json`

Known unsupported family cases, such as the current Angular `semantic-first` gaps, stay visible in raw reports and aggregate outputs and are excluded from fair family-comparison denominators rather than hidden behind fallback logic.

The active corpus now includes:

- home load
- sign in
- open global feed
- open first article from feed
- paginate a tagged feed
- add a comment
- follow and unfollow a profile
- update user bio

## Scripts

Run one app:

```bash
npm run benchmark:baseline:app --appid=angular-realworld-example-app
npm run benchmark:collect:app --appid=realworld
npm run benchmark:generate:app --appid=vue3-realworld-example-app --budget=3 --seed=12345
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=3 --seed=12345
npm run benchmark:mutate:app --appid=realworld --limit=1
npm run benchmark:aggregate:app --appid=vue3-realworld-example-app
```

Run all apps:

```bash
npm run benchmark:baseline:all
npm run benchmark:aggregate:all
```

Select browser coverage with `PLAYWRIGHT_BROWSERS` when needed:

```bash
PLAYWRIGHT_BROWSERS=chromium npm run benchmark:baseline:all
PLAYWRIGHT_BROWSERS=chromium,firefox,webkit npm run benchmark:baseline:all
```

## Verification Artifacts

Machine-readable proof of the currently working pipeline lives in:

- `reports/realworld-benchmark-corpus.json`
- `reports/realworld-pipeline-verification.json`

These reports document:

- active corpus membership
- excluded RealWorld specs and why they are excluded
- app-by-app baseline / collect / generate / mutate / aggregate status
- artifact locations
- known unsupported and excluded comparison cases

## Notes

- Application-source edits are limited to non-behavioral test hooks such as `data-testid`.
- Route differences are handled in the benchmark adapter layer, not by rewriting app behavior.
- The legacy TodoMVC pilot wiring remains available only as a compatibility adapter and is no longer the main RealWorld execution path.
