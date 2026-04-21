# Thesis Alignment Notes

Date: 2026-04-12

This file reflects the current repo state rather than a future to-do list.

## Current Alignment Snapshot

- The active thesis corpus is `realworld-active`.
- The corpus currently contains 12 active shared scenarios plus explicitly tracked excluded scenarios.
- The benchmark entry point is the shared fixture at `tests/realworld/benchmark-active.spec.ts`.
- Oracle locators are treated as a separate ground-truth layer rather than part of the compared locator-family set.
- Source-spec migration status is explicit in the corpus manifest and related reports.

## Methodology Points The Thesis Text Should Match

- The compared locator families are `semantic-first`, `css`, and `xpath`.
- The benchmark uses four thesis-aligned mutation categories:
  - `structural`
  - `content`
  - `accessibility-semantic`
  - `visibility-interaction-state`
- Visual-only operators exist in code but are explicitly excluded by design from the thesis benchmark.
- Scenario preparation is a four-stage pipeline:
  - reachable-target collection
  - deterministic candidate generation
  - checkpoint-aware preflight validation on an oversampled pool
  - final selection from validated candidates only
- For budgets of four or more, final selection enforces mandatory category coverage when possible.
- Touchpoint relevance and meaningful-effect checks are part of dataset quality control.

## Oracle And Safety Narrative

The implementation narrative should describe:

- oracle purity / oracle-safety checks
- explicit `oracle-protected` skip behavior
- protection of interactive and form-critical regions from destructive structural mutation
- the current direct-anchor-safe path for selected operators that can mutate protected direct anchors without invalidating oracle grounding

That last point matters because it is how the current benchmark maintains category coverage in apps whose comparable touchpoints are heavily anchored by `data-testid`.

## Accessibility Narrative

The thesis text should distinguish:

- benchmark failure classification
- accessibility scan status

Accessibility outputs now have two different aggregate views:

- completed-scan-only summaries
- all-valid-run scan-completeness summaries

Those should not be described as interchangeable.

## Cross-Browser Framing

Current repo framing:

- Chromium on Linux is the thesis-primary environment
- Firefox and WebKit are supplementary regression/smoke evidence unless the methodology section is explicitly broadened

## CI / Artifact Surface

The implementation section can now cite:

- structured benchmark result JSON and CSV export
- schema versioning and dataset versioning
- aggregate family/category/operator summaries
- mutation telemetry summaries
- selection-quality summaries
- compact-vs-full retention behavior
- comparable-yield checks after aggregation

## Repo Artifacts Worth Citing

- [`realworld-benchmark-corpus.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-benchmark-corpus.json)
- [`realworld-migration-matrix.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-migration-matrix.json)
- [`realworld-operator-taxonomy.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-operator-taxonomy.json)
- [`realworld-operator-coverage.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-operator-coverage.json)
- [`realworld-pipeline-verification.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-pipeline-verification.json)
- [`realworld-semantic-css-exceptions.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-semantic-css-exceptions.json)
