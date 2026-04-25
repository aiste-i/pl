# CI And Reports

The repository has two GitHub workflow layers:

- `pr-realworld.yml`: validation on pull requests, pushes to `main`, and pushes to `feat/**`.
- `thesis-primary.yml`: manual Chromium dataset generation for thesis-primary artifacts.

## PR Validation

The PR workflow runs:

- dependency installation
- app dependency installation
- Playwright browser installation
- lint, including ESLint locator-family purity and corpus-status checks
- typecheck
- unit tests
- RealWorld methodological validation specs
- Chromium baseline corpus
- deterministic one-mutation sample preparation per app
- Chromium mutation sample
- result schema validation
- aggregation
- source-derived report freshness check

Uploaded artifacts include:

- `reports`
- `test-results`

## Thesis-Primary Workflow

The manual thesis-primary workflow runs Chromium with:

- `BENCHMARK_CORPUS_ID=realworld-active`
- `BENCHMARK_RETENTION=compact`

Inputs:

- mutation budget per app
- deterministic seed

It runs validation, baseline, deterministic preparation, full mutation execution, schema validation, aggregation, comparable-yield checks, and run-derived report generation.

Uploaded artifacts include:

- `artifacts`
- `reports`
- `test-results`

## Report Types

Source-derived reports describe the benchmark implementation surface:

- corpus and migration matrix
- locator inventory and support
- semantic CSS exceptions
- operator taxonomy and coverage
- pipeline verification

Run-derived reports summarize the currently aggregated dataset:

- accessibility summary copies
- scan status summary
- aggregate run outputs
- operator telemetry

## Commands

Regenerate all reports:

```bash
npm run reports:generate
```

Regenerate source-derived reports:

```bash
npm run reports:generate:source
```

Regenerate run-derived reports from current aggregate artifacts:

```bash
npm run reports:generate:run
```

Check source-derived report freshness:

```bash
npm run reports:check:source
```

Check full report freshness against the current dataset:

```bash
npm run reports:check
```

Use `reports:check:source` as the PR-safe check. `reports:check` depends on run-derived artifacts and is stricter.
