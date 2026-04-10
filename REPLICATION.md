# Replication Guide

This guide is for reviewers reproducing the Playwright RealWorld locator-robustness benchmark from a clean checkout.

## Purpose

The benchmark compares exactly three Playwright locator families under controlled non-breaking UI mutation:

- `semantic-first`
- `css`
- `xpath`

The oracle is a separate ground-truth layer and is not part of the benchmark comparison. Scenario logic is shared across locator families; only locator construction differs. Chromium is the thesis-primary browser unless an explicit multi-browser dataset is generated.

## System Requirements

- Node.js 20.x for CI-equivalent reproduction. The current local workspace may run newer Node versions, but reviewer reproduction should use Node 20 unless intentionally testing toolchain drift.
- npm matching the Node 20 distribution, or a compatible newer npm.
- Playwright `1.58.2`, pinned through `package-lock.json`.
- Browsers installed through Playwright:
  - Chromium for thesis-primary runs.
  - Chromium, Firefox, and WebKit for cross-browser dataset generation.
- Linux is the primary CI platform. Windows and macOS can run the pipeline, but artifact paths and browser dependencies may differ.

## Clean Install

```bash
git clone <repo-url>
cd benchmark
npm ci
npm run install:apps
npx playwright install --with-deps chromium
```

For cross-browser reproduction:

```bash
npx playwright install --with-deps chromium firefox webkit
```

## Validation And Unit Tests

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run validate:realworld
```

`test:unit` covers schema validation, deterministic mutation selection, and operator applicability without running the full browser benchmark corpus.

## Minimal Reproduction

This runs one app with a one-mutation sample:

```bash
npm run benchmark:baseline:app --appid=angular-realworld-example-app
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=1 --seed=12345
npm run benchmark:mutate:app --appid=angular-realworld-example-app --limit=1
npm run validate:results -- test-results/angular-realworld-example-app/realworld-active/benchmark-runs
npm run benchmark:aggregate:app -- test-results/angular-realworld-example-app/realworld-active/benchmark-runs test-results/angular-realworld-example-app/realworld-active/aggregate
```

Expected outputs:

- `test-results/angular-realworld-example-app/realworld-active/benchmark-runs/*.json`
- `test-results/angular-realworld-example-app/realworld-active/accessibility-artifacts/*_axe.json`
- `test-results/angular-realworld-example-app/realworld-active/reachable-targets.json`
- `test-results/angular-realworld-example-app/realworld-active/scenarios.json`
- `test-results/angular-realworld-example-app/realworld-active/aggregate/*.csv`
- `test-results/angular-realworld-example-app/realworld-active/aggregate/aggregate_report.json`
- `artifacts/<run-id>/run-metadata.json`
- `artifacts/<run-id>/results.json`
- `artifacts/<run-id>/results.csv`

## Thesis-Primary Chromium Run

Chromium is the primary dataset dimension for thesis claims:

```bash
npm run benchmark:baseline:primary
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=20 --seed=12345
npm run benchmark:prepare:app --appid=realworld --budget=20 --seed=12345
npm run benchmark:prepare:app --appid=vue3-realworld-example-app --budget=20 --seed=12345
npm run benchmark:mutate:all
npm run validate:results
npm run benchmark:aggregate:all
npm run reports:generate:run
```

Use the same seed and budget to reproduce the same selected mutation IDs. The generated `scenarios.json` files contain the sampled mutations and their `selectionSeed`.

The same path is available as a manual GitHub Actions workflow:

- `Thesis Primary Chromium Dataset`
- default `budget`: `10`
- default `seed`: `12345`

The workflow uploads `artifacts`, `reports`, and `test-results` as a single thesis-primary artifact bundle.

## Cross-Browser Dataset Generation

Baseline cross-browser dataset:

```bash
npx playwright install --with-deps chromium firefox webkit
npm run benchmark:baseline:cross-browser
npm run validate:results
npm run benchmark:aggregate:all
```

Optional full cross-browser mutation dataset:

```bash
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=20 --seed=12345
npm run benchmark:prepare:app --appid=realworld --budget=20 --seed=12345
npm run benchmark:prepare:app --appid=vue3-realworld-example-app --budget=20 --seed=12345
npm run benchmark:mutate:cross-browser
npm run validate:results
npm run benchmark:aggregate:all
```

Cross-browser records include `browserName` in structured JSON, CSV exports, aggregate summaries, and metadata. Browser identity is not inferred from filenames.

## Pipeline Stages

Baseline benchmark:

```bash
npm run benchmark:baseline:primary
```

Mutation preparation:

```bash
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=20 --seed=12345
```

Mutation execution:

```bash
npm run benchmark:mutate:all
```

Aggregation:

```bash
npm run benchmark:aggregate:all
```

Result validation:

```bash
npm run validate:results
```

Report regeneration:

```bash
npm run reports:generate
```

## Determinism Check

To verify deterministic selection:

```bash
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=8 --seed=12345
cp test-results/angular-realworld-example-app/realworld-active/scenarios.json test-results/angular-realworld-example-app/realworld-active/scenarios.seed-12345.a.json
npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=8 --seed=12345
```

Compare the `scenarios` arrays in both files. The selected `candidateId` sequence must match. Changing `--seed` should change the sequence.

## Docker

No Dockerfile is currently required for CI. If adding Docker support, use the official Playwright base image matching Playwright `1.58.2`, run `npm ci`, then run the same commands above. Do not use Docker to change benchmark semantics or browser defaults.

## Troubleshooting

Missing browsers:

```bash
npx playwright install --with-deps chromium
```

For cross-browser:

```bash
npx playwright install --with-deps chromium firefox webkit
```

App startup timing:

- Ensure `npm run install:apps` completed.
- Check that no local process is already using ports `4300`, `4301`, or `4302`.
- Keep `workers: 1`; the benchmark assumes controlled app startup and serial execution.

Schema validation errors:

- Run `npm run validate:results -- <path>`.
- The validator prints JSON path and message.
- Do not aggregate invalid records; aggregation validates records before consuming them.

Skipped mutations:

- `oracle-protected` means the candidate would corrupt oracle grounding.
- `behavior-preservation-gate-failed` means the operator rejected the target as unsafe or inapplicable.
- `checkpoint-not-reached` means the scenario did not reach the planned mutation point.

Accessibility scan failures:

- Failed scans are recorded as `scanStatus: "failed"` with `scanError`.
- Skipped scans are explicit and normally indicate invalid setup or mutation application.
- Accessibility summaries should distinguish completed-scan-only summaries from all-valid-run scan coverage.
