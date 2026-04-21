# Replication Guide

This guide describes the current end-to-end workflow for reproducing the Playwright RealWorld locator-robustness benchmark from a clean checkout.

## Purpose

The benchmark compares exactly three locator families under controlled non-breaking DOM/accessibility mutation:

- `semantic-first`
- `css`
- `xpath`

The oracle is a separate ground-truth layer implemented through dedicated oracle locators. It is not one of the compared families.

The thesis-primary dataset is Chromium-based unless an explicit cross-browser run is requested.

## Current Corpus Status

The active corpus is `realworld-active`.

It currently contains 12 active shared scenarios across:

- Angular RealWorld
- Svelte RealWorld (`realworld`)
- Vue 3 RealWorld

Corpus metadata is defined in:

- [`realworld-corpus.ts`](/c:/Users/aiste/Desktop/benchmark/src/benchmark/realworld-corpus.ts)

The corpus also tracks excluded-by-design and excluded-methodological scenarios so coverage decisions remain explicit.

## System Requirements

- Node.js 20.x for CI-equivalent reproduction
- npm compatible with the Node 20 toolchain
- Playwright `1.58.2`, pinned through `package-lock.json`
- Playwright browsers installed locally

Primary browser install:

```bash
npx playwright install --with-deps chromium
```

Cross-browser install:

```bash
npx playwright install --with-deps chromium firefox webkit
```

## Clean Install

```bash
git clone <repo-url>
cd benchmark
npm ci
npm run install:apps
npx playwright install --with-deps chromium
```

## Validation Before Benchmark Runs

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run validate:realworld
```

`test:unit` now covers:

- schema validation
- deterministic mutation selection
- operator applicability and oracle-safety edge cases
- retention behavior
- touchpoint-aware sampling and comparable-yield checks

## Minimal Reproduction

One app, one selected mutation:

```bash
npm run benchmark:baseline:app --appid=angular-realworld-example-app
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=1 --seed=12345
npm run benchmark:mutate:app --appid=angular-realworld-example-app --limit=1
npm run validate:results -- test-results/angular-realworld-example-app/realworld-active/benchmark-runs
npm run benchmark:aggregate:app -- test-results/angular-realworld-example-app/realworld-active/benchmark-runs test-results/angular-realworld-example-app/realworld-active/aggregate
```

Expected app-level outputs now include:

- `reachable-targets.json`
- `scenario-preflight-pool.json`
- `scenario-preflight-results.json`
- `scenarios.json`
- `benchmark-runs/*.json`
- `aggregate/*.csv`
- `aggregate/aggregate_report.json`
- `aggregate/run-metadata.json`

Under `BENCHMARK_RETENTION=full`, you should also see:

- `accessibility-artifacts/*_axe.json`
- mirrored per-run artifacts under `artifacts/<run-id>/`

## Thesis-Primary Chromium Run

```bash
npm run benchmark:baseline:primary
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=20 --seed=12345
npm run benchmark:prepare:app --appid=realworld --budget=20 --seed=12345
npm run benchmark:prepare:app --appid=vue3-realworld-example-app --budget=20 --seed=12345
npm run benchmark:mutate:all
npm run validate:results
npm run benchmark:aggregate:all
npm run benchmark:check:yield
npm run reports:generate:run
```

This is the thesis-primary path for repo-level claims unless you intentionally generate a broader browser dataset.

## What `benchmark:prepare:app` Does Now

`benchmark:prepare:app` is a multi-stage wrapper around:

1. reachable-target collection
2. deterministic candidate generation
3. preflight execution on an oversampled candidate pool
4. scenario finalization from preflight-validated candidates only

Important current behavior:

- default mutation budget is `20`
- default seed is `12345`
- preflight oversample factors default to `3,5,8,12,16`
- finalization can fail if the validated pool does not satisfy the requested budget or mandatory category coverage

Relevant controls:

- `BENCHMARK_BUDGET`
- `BENCHMARK_SEED`
- `PREFLIGHT_OVERSAMPLE_FACTORS`
- `PREFLIGHT_TEST_TIMEOUT_MS`

## Mutation Execution Semantics

Mutation runs are expected to produce all three kinds of benchmark outcomes:

- `passed`
- `failed`
- `invalid`

In mutate mode, genuine locator-family failures are recorded as benchmark outcomes and should not be interpreted as a broken CI job by themselves. The meaningful post-run checks are:

- structured run JSON
- result validation
- aggregate summaries
- comparable-yield checks

## Aggregation

Single app:

```bash
npm run benchmark:aggregate:app -- test-results/angular-realworld-example-app/realworld-active/benchmark-runs test-results/angular-realworld-example-app/realworld-active/aggregate
```

All thesis-primary apps:

```bash
npm run benchmark:aggregate:all
```

Aggregation now emits:

- family/category/operator summaries
- cross-browser summaries when applicable
- exclusion and denominator summaries
- accessibility scan summaries
- mutation telemetry summaries
- selection-quality summaries when preflight metadata is present

## Determinism Check

```bash
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=8 --seed=12345
cp test-results/angular-realworld-example-app/realworld-active/scenarios.json test-results/angular-realworld-example-app/realworld-active/scenarios.seed-12345.a.json
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=8 --seed=12345
```

Compare the `candidateId` sequence in both `scenarios.json` files. It must match for the same seed and budget. Changing the seed should change the sequence.

## Cross-Browser Runs

Baseline cross-browser:

```bash
npx playwright install --with-deps chromium firefox webkit
npm run benchmark:baseline:cross-browser
npm run validate:results
npm run benchmark:aggregate:all
```

Optional mutation dataset:

```bash
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=20 --seed=12345
npm run benchmark:prepare:app --appid=realworld --budget=20 --seed=12345
npm run benchmark:prepare:app --appid=vue3-realworld-example-app --budget=20 --seed=12345
npm run benchmark:mutate:cross-browser
npm run validate:results
npm run benchmark:aggregate:all
```

Cross-browser evidence is supplementary unless the methodology is explicitly broadened beyond the thesis-primary Chromium framing.

## Troubleshooting

### Missing browsers

```bash
npx playwright install --with-deps chromium
```

or

```bash
npx playwright install --with-deps chromium firefox webkit
```

### App startup issues

- run `npm run install:apps`
- keep execution serial; the benchmark assumes `workers: 1`
- ensure local ports used by app fixtures are free

### Result validation errors

- run `npm run validate:results -- <path>`
- fix schema violations before aggregation

### Finalize/preparation failures

Common causes:

- insufficient validated candidates for the requested budget
- missing mandatory category coverage
- too many candidates rejected as `oracle-protected`, `relevance-too-weak`, or non-meaningful

Inspect:

- `scenario-preflight-results.json`
- `scenario-preflight-pool.json`
- `scenarios.json`

### Accessibility retention

- `BENCHMARK_RETENTION=full` keeps raw run JSON and detailed axe artifacts
- `BENCHMARK_RETENTION=compact` keeps aggregate outputs and prunes raw benchmark run and accessibility-artifact directories after aggregation
