# Playwright RealWorld Mutation Benchmark

This repository implements a controlled Playwright benchmark of locator-family robustness under non-breaking UI change across three RealWorld applications:

- `angular-realworld-example-app`
- `realworld`
- `vue3-realworld-example-app`

The benchmark comparison boundary is fixed to exactly three locator families:

- `semantic-first`
- `css`
- `xpath`

Oracle locators are not part of that comparison. They are a separate ground-truth layer that resolves through `getByTestId()` chains only.

## Benchmark Scope

The executable thesis-active corpus is `realworld-active`, driven through [`tests/realworld/benchmark-active.spec.ts`](/c:/Users/aiste/Desktop/benchmark/tests/realworld/benchmark-active.spec.ts).

It currently contains 12 migrated shared scenarios:

- `health.home-load`
- `auth.sign-in-valid`
- `feed.open-global-feed`
- `article.open-from-feed`
- `article.favorite-from-detail`
- `article.preview-description-visibility`
- `navigation.pagination`
- `comments.add-on-article`
- `comments.delete-own`
- `article.assert-title`
- `social.follow-unfollow`
- `settings.update-bio`

Migration debt is no longer tracked as a temporary state. Every RealWorld source spec is now classified as either:

- migrated into the benchmark-active corpus
- excluded by design
- excluded on methodological grounds

The current source-spec matrix is published in:

- [`reports/realworld-benchmark-corpus.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-benchmark-corpus.json)
- [`reports/realworld-migration-matrix.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-migration-matrix.json)

Remaining explicit exclusions are:

- `tests/realworld/error-handling.spec.ts`
- `tests/realworld/null-fields.spec.ts`
- `tests/realworld/url-navigation.spec.ts`
- `tests/realworld/user-fetch-errors.spec.ts`
- `tests/realworld/xss-security.spec.ts`

The XSS/security spec remains excluded by methodology because it measures sanitization guarantees rather than locator robustness.

## Locator And Oracle Rules

- Scenario logic stays constant across `semantic-first`, `css`, and `xpath`; only locator resolution changes.
- `semantic-first` starts with Playwright semantic queries such as `getByRole(...)`, `getByLabel(...)`, `getByText(...)`, `getByPlaceholder(...)`, `getByAltText(...)`, or `getByTitle(...)`.
- `css` uses CSS only.
- `xpath` uses XPath only.
- No benchmarked locator uses cross-family fallback.
- Oracle locators use chained `getByTestId()` only.
- Oracle-critical nodes and ancestors are protected from mutation.

Oracle purity migration details are documented in:

- [`ORACLE_PURITY_MIGRATION.md`](/c:/Users/aiste/Desktop/benchmark/ORACLE_PURITY_MIGRATION.md)

Cross-framework repeated oracle anchors now use stable `data-testid` patterns, including:

- `article-preview-1`, `article-read-more-1`
- `comment-card-<id>`
- `pagination-item-<n>`, `pagination-link-<n>`

The current semantic exception report is version-controlled in:

- [`reports/realworld-semantic-css-exceptions.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-semantic-css-exceptions.json)

At the moment, the active RealWorld corpus has no remaining semantic CSS exceptions.

## Mutation Scope

In-scope mutation operators are categorized into the thesis taxonomy:

- structural
- content
- accessibility-semantic
- visibility-interaction-state

Visual-only operators are not left in an ambiguous half-integrated state. They are present in the catalog and explicitly marked `excluded-by-design`.

Machine-readable mutation artifacts:

- [`reports/realworld-operator-taxonomy.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-operator-taxonomy.json)
- [`reports/realworld-operator-coverage.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-operator-coverage.json)

The operator taxonomy now records, for every operator:

- thesis category
- DOM applicability conditions
- non-breaking safety guard

Per-run mutation telemetry is flattened during aggregation so reviewers can inspect:

- selected candidate id
- mutated selector and target tag type
- operator runtime and thesis category
- candidate counts, applicability counts, and final outcome class

Aggregate CSV evidence now includes:

- `mutation_run_telemetry.csv`
- `operator_telemetry_summary.csv`

## Execution Environments

Primary benchmark environment:

- Chromium on Linux

Supplementary cross-browser dataset dimensions when explicitly generated:

- Firefox
- WebKit

This distinction is deliberate. Firefox and WebKit coverage strengthens engineering confidence and reproducibility, but it does not silently redefine the thesis dataset.

Environment and workflow proof is published in:

- [`reports/realworld-pipeline-verification.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-pipeline-verification.json)

## Key Scripts

Validation:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run validate:realworld
npm run reports:generate:source
```

Primary Chromium baseline:

```bash
npm run benchmark:baseline:primary
```

Cross-browser baseline dataset:

```bash
npm run benchmark:baseline:cross-browser
```

Prepare one app for mutation sampling:

```bash
PLAYWRIGHT_BROWSERS=chromium npm run benchmark:prepare:app --appid=angular-realworld-example-app --budget=1 --seed=12345
```

Run a Chromium mutation sample across all three apps:

```bash
npm run benchmark:mutate:sample:all
```

Run the full selected mutation set across all three apps:

```bash
npm run benchmark:mutate:all
```

Run the selected mutation set across all three apps and all supported browsers:

```bash
npm run benchmark:mutate:cross-browser
```

Aggregate benchmark outputs:

```bash
npm run benchmark:aggregate:all
```

Validate structured benchmark outputs:

```bash
npm run validate:results
```

Check post-aggregation comparable yield:

```bash
npm run benchmark:check:yield
```

Regenerate machine-readable reports:

```bash
npm run reports:generate
```

Regenerate only source-derived reports:

```bash
npm run reports:generate:source
```

Regenerate run-derived reports from the current aggregated benchmark artifacts:

```bash
npm run reports:generate:run
```

Check source-derived report freshness on a clean tree:

```bash
npm run reports:check:source
```

Check full report freshness against the current benchmark dataset:

```bash
npm run reports:check
```

`reports:check:source` is the PR-safe CI gate. It only regenerates deterministic source-derived artifacts.

`reports:check` is the stricter full-dataset check. It regenerates both source-derived and run-derived report artifacts and fails if the committed contents under `reports/` drift from the current benchmark dataset.

## Result Layout

Artifacts are app-scoped and corpus-scoped:

- `test-results/<app-id>/realworld-active/benchmark-runs`
- `test-results/<app-id>/realworld-active/accessibility-artifacts`
- `test-results/<app-id>/realworld-active/reachable-targets.json`
- `test-results/<app-id>/realworld-active/scenarios.json`
- `test-results/<app-id>/realworld-active/aggregate`
- `artifacts/<run-id>/run-metadata.json`
- `artifacts/<run-id>/results.json`
- `artifacts/<run-id>/results.csv`

Aggregate outputs preserve:

- run-level comparison eligibility
- unsupported family exclusions
- accessibility scan status
- operator telemetry
- browser dimensions

The formal result contract is defined in `schemas/benchmark-results.schema.json` and enforced by `npm run validate:results`.

Accessibility summary CSVs are retained in the aggregate artifact location for each app under:

- `test-results/<app-id>/realworld-active/aggregate/accessibility_summary_completed_only.csv`
- `test-results/<app-id>/realworld-active/aggregate/accessibility_summary_all_valid_runs.csv`

Reviewer-facing copies are also version-controlled under:

- [`reports/realworld-accessibility-summary-completed-only.csv`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-accessibility-summary-completed-only.csv)
- [`reports/realworld-accessibility-summary-all-valid-runs.csv`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-accessibility-summary-all-valid-runs.csv)
- [`reports/realworld-accessibility-scan-status-summary.csv`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-accessibility-scan-status-summary.csv)

Retention mode is controlled with `BENCHMARK_RETENTION=full|compact`:

- `full` keeps per-run mirrors under `artifacts/<run-id>/` and detailed axe JSON under `test-results/<app-id>/realworld-active/accessibility-artifacts/`
- `compact` keeps the aggregate dataset under `test-results/<app-id>/realworld-active/aggregate/` plus the generated reviewer-facing `reports/` outputs, then prunes raw run JSON and detailed accessibility artifacts after aggregation

## CI

The repository ships two workflow layers:

- PR validation in [`/.github/workflows/pr-realworld.yml`](/c:/Users/aiste/Desktop/benchmark/.github/workflows/pr-realworld.yml)
- scheduled smoke and mutation sampling in [`/.github/workflows/scheduled-realworld.yml`](/c:/Users/aiste/Desktop/benchmark/.github/workflows/scheduled-realworld.yml)
- manual thesis-primary Chromium dataset generation in [`/.github/workflows/thesis-primary.yml`](/c:/Users/aiste/Desktop/benchmark/.github/workflows/thesis-primary.yml)

PR validation enforces linting, typechecking, unit tests, methodological validation specs, Chromium baseline coverage, deterministic Chromium mutation-sample preparation, schema validation, aggregation, and source-derived report freshness. The scheduled workflow generates a cross-browser baseline dataset plus the same Chromium mutation-sample and aggregation path. Full run-derived report regeneration remains tied to the benchmark dataset that was actually aggregated.

## Additional Docs

- [`BENCHMARK_ARCHITECTURE.md`](/c:/Users/aiste/Desktop/benchmark/BENCHMARK_ARCHITECTURE.md)
- [`AGGREGATION_PIPELINE.md`](/c:/Users/aiste/Desktop/benchmark/AGGREGATION_PIPELINE.md)
- [`REPLICATION.md`](/c:/Users/aiste/Desktop/benchmark/REPLICATION.md)
- [`DATASET.md`](/c:/Users/aiste/Desktop/benchmark/DATASET.md)
- [`docs/MUTATION_OPERATORS.md`](/c:/Users/aiste/Desktop/benchmark/docs/MUTATION_OPERATORS.md)
- [`reports/realworld-locator-audit.md`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-locator-audit.md)
- [`THESIS_ALIGNMENT_NOTES.md`](/c:/Users/aiste/Desktop/benchmark/THESIS_ALIGNMENT_NOTES.md)
