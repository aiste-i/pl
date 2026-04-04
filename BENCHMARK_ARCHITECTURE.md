# Benchmark Architecture

## Core Pieces

- `src/apps/*`: app registry and per-app adapters
- `playwright.config.ts`: resolves `APP_ID` and starts the selected benchmark subject
- `tests/baseFixture.ts`: app-aware benchmark fixture, result writing, mutation application, accessibility scan linkage
- `src/locators/apps/*`: per-app locator and oracle factories
- `src/locators/realworld/*`: shared logical locator contract and coverage metadata
- `src/benchmark/realworld-corpus.ts`: benchmark-active corpus definition
- `tests/realworld/*`: shared RealWorld flow corpus
- `tests/realworld/benchmark-active.spec.ts`: current executable benchmark-active corpus entrypoint

## Comparison Model

All benchmarked locator factories implement the same logical keys across:

- `semantic-first`
- `css`
- `xpath`

Oracle factories are independent and use `getByTestId(...)` only.

## Active Corpus Boundary

The current end-to-end pipeline runs against the benchmark-active corpus `realworld-active`, not against the full `tests/realworld` directory.

Current active shared source intent:

- `tests/realworld/health.spec.ts`

Current executable entrypoint:

- `tests/realworld/benchmark-active.spec.ts`

Temporary exclusions are tracked in both:

- `src/benchmark/realworld-corpus.ts`
- `reports/realworld-benchmark-corpus.json`

This keeps the executable benchmark scope explicit while the remaining shared RealWorld specs are still migration debt.

## Artifact Scoping

All outputs are app-scoped and corpus-scoped under `test-results/<app-id>/<corpus-id>/...` so baseline runs, target collection, scenario generation, mutated runs, and aggregation stay reproducible and isolated.

For the current active corpus, the concrete layout is:

- `test-results/<app-id>/realworld-active/benchmark-runs`
- `test-results/<app-id>/realworld-active/accessibility-artifacts`
- `test-results/<app-id>/realworld-active/reachable-targets.json`
- `test-results/<app-id>/realworld-active/scenarios.json`
- `test-results/<app-id>/realworld-active/aggregate`

Aggregate outputs include excluded unsupported coverage so unsupported family/app combinations remain visible while staying out of fair family-comparison denominators.

## Compatibility Rule

The benchmark treats the RealWorld apps as benchmark subjects. Application edits are restricted to non-behavioral hooks such as missing `data-testid` attributes required by oracle factories.

## Execution Flow

For each selected app, the current pipeline is:

1. Run baseline against `tests/realworld/benchmark-active.spec.ts`
2. Collect reachable targets into the app+corpus scoped registry
3. Generate mutation scenarios from those targets
4. Re-run the benchmark-active corpus with mutations applied
5. Aggregate benchmark-run outputs into family/app summaries

The package scripts in `package.json` wire this flow for one app or all three apps.
