# Thesis Alignment Notes

Date: 2026-04-05

## Chapter 2 Updates

- Update the corpus description to state that the thesis-active RealWorld corpus now consists of 12 migrated shared scenarios with an explicit source-spec disposition matrix.
- Remove any wording that describes the remaining exclusions as temporary migration debt.
- State that oracle locators are a separate ground-truth layer implemented through `getByTestId()` chains only.
- Clarify that repeated entities such as comments are verified through stable test-id addressing rather than visible text.
- Update the locator-family methodology to note that semantic-first anti-patterns like role locators narrowed by descendant text have been removed where direct accessible-name queries are available.
- Add the operator taxonomy used in implementation: structural, content, accessibility-semantic, and visibility-interaction-state.
- State that visual-only operators are explicitly excluded by design rather than implicitly absent.

## Chapter 3 Updates

- Update the implementation narrative to reflect the benchmark-active shared fixture and the 12 active scenarios in `realworld-active`.
- Add the source-spec migration matrix summary: migrated vs excluded-by-design vs excluded-methodological.
- Describe the new oracle purity validation layer and oracle-safety mutation checks.
- Describe operator telemetry capture and the operator coverage artifacts now emitted by the pipeline.
- Revise accessibility aggregation wording to distinguish completed-scan-only summaries from all-valid-run scan-completeness summaries.
- Clarify that Chromium on Linux remains the primary benchmark environment.
- Describe Firefox and WebKit as supplementary smoke/regression evidence unless the methodology chapter is revised to make them part of the primary dataset.
- Add the CI proof surface: PR validation workflow, scheduled smoke workflow, and report-freshness enforcement.

## Terms To Retire

- temporary migration debt
- lower-bound accessibility summary as the primary accessibility output
- implicit operator scope
- broad cross-browser primary-claim wording

## Repo Artifacts To Cite

- [`reports/realworld-benchmark-corpus.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-benchmark-corpus.json)
- [`reports/realworld-migration-matrix.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-migration-matrix.json)
- [`reports/realworld-operator-taxonomy.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-operator-taxonomy.json)
- [`reports/realworld-operator-coverage.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-operator-coverage.json)
- [`reports/realworld-pipeline-verification.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-pipeline-verification.json)
- [`reports/realworld-semantic-css-exceptions.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-semantic-css-exceptions.json)
