# Benchmark Aggregation And Reporting Pipeline

## Overview

The aggregation pipeline converts per-run benchmark JSON artifacts into thesis-ready CSV and JSON summaries while preserving methodological context that matters for interpretation:

- corpus membership
- source spec
- scenario identity
- browser
- comparison eligibility
- accessibility scan status
- mutation telemetry

Main implementation:

- [`src/murun/runner/aggregate.ts`](/c:/Users/aiste/Desktop/benchmark/src/murun/runner/aggregate.ts)

Validation:

- [`tests/AggregationValidation.spec.ts`](/c:/Users/aiste/Desktop/benchmark/tests/AggregationValidation.spec.ts)

## Input Population

Aggregator input comes from:

- `test-results/<app-id>/realworld-active/benchmark-runs/*.json`

The loader rejects malformed or legacy non-corpus records that do not contain the benchmark-active corpus fields required for the thesis dataset.

Minimum accepted run metadata includes:

- `runId`
- `applicationId`
- `browserName`
- `corpusId`
- `activeScenarioId`
- `activeScenarioCategory`
- `sourceSpec`
- `locatorFamily`
- `phase`

Additional preserved fields include:

- `runStatus`
- `failureClass`
- `changeId`
- `changeOperator`
- `changeCategory`
- `comparisonEligible`
- `comparisonExclusionReason`
- `durationMs`
- `accessibility`
- `mutationTelemetry`

## Normalization Rules

- invalid benchmark runs are excluded from analytical summaries
- legacy non-corpus results are rejected instead of mixed into the thesis dataset
- missing accessibility blocks default to a skipped scan state, not to a completed scan
- mutation categories are derived from the operator catalog when missing
- unsupported family combinations remain visible through separate exclusion artifacts instead of being silently dropped

## Accessibility Integrity Model

Accessibility remains a support layer, not the benchmark oracle.

The aggregator now preserves scan completeness explicitly and emits two separate accessibility summaries:

- `accessibility_summary_completed_only.csv`
- `accessibility_summary_all_valid_runs.csv`

Interpretation rules:

- completed-only summaries are the correct source for violation prevalence and severity comparisons
- all-valid-run summaries describe scan coverage and completeness across otherwise valid runs
- failed or skipped scans no longer silently masquerade as zero-violation completed scans in the main summary

Additional scan-status output:

- `accessibility_scan_status_summary.csv`

The JSON aggregate report mirrors the same split under:

- `accessibility.scanStatusSummary`
- `accessibility.completedOnly`
- `accessibility.allValidRuns`

## Mutation Telemetry Model

Mutation telemetry is captured at run level and summarized per operator. The current telemetry surface includes:

- `operatorCandidateCount`
- `operatorApplicableCount`
- `operatorSkippedOracleCount`
- `operatorNotApplicableCount`
- `operatorCheckDurationMs`
- `applyDurationMs`
- `applyFailureCount`
- `finalMutationOutcomeClass`

Operator-level summary output:

- `operator_telemetry_summary.csv`

This allows the pipeline to report operator coverage and execution behavior, not just operator presence in code.

## Output Files

Per aggregation directory the pipeline writes:

- `benchmark_runs.csv`
- `summary_by_family.csv`
- `summary_by_family_and_category.csv`
- `summary_by_family_and_operator.csv`
- `failure_distribution.csv`
- `summary_by_app.csv`
- `summary_by_browser.csv`
- `comparison_denominators.csv`
- `exclusion_summary.csv`
- `excluded_unsupported.csv`
- `excluded_unsupported.json`
- `accessibility_scan_status_summary.csv`
- `accessibility_summary_completed_only.csv`
- `accessibility_summary_all_valid_runs.csv`
- `operator_telemetry_summary.csv`
- `aggregate_report.json`

## Comparison Semantics

The aggregate layer distinguishes between:

- all mutated runs
- comparison-eligible mutated runs
- unsupported or excluded mutated runs

This matters because unsupported family/app combinations and documented comparison exclusions must stay visible for auditability while remaining outside fair family-level denominators.

Key denominator outputs:

- `summary_by_family.csv`
- `summary_by_family_and_category.csv`
- `summary_by_family_and_operator.csv`
- `comparison_denominators.csv`

## Machine-Readable Support Reports

The aggregation pipeline is complemented by generated repo-level reports that describe the benchmark surface around the run artifacts:

- [`reports/realworld-benchmark-corpus.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-benchmark-corpus.json)
- [`reports/realworld-migration-matrix.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-migration-matrix.json)
- [`reports/realworld-operator-taxonomy.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-operator-taxonomy.json)
- [`reports/realworld-operator-coverage.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-operator-coverage.json)
- [`reports/realworld-pipeline-verification.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-pipeline-verification.json)

## Commands

Aggregate one app:

```bash
npm run benchmark:aggregate:app --appid=angular-realworld-example-app
```

Aggregate all RealWorld apps:

```bash
npm run benchmark:aggregate:all
```

Regenerate repo-level machine-readable reports:

```bash
npm run reports:generate
```

Check generated-report freshness on a clean tree:

```bash
npm run reports:check
```

## Validation Coverage

The aggregation validation suite currently checks:

- invalid-run exclusion from analytical populations
- denominator separation between total mutated and comparison-eligible mutated runs
- accessibility split outputs
- operator telemetry serialization into aggregate outputs

Residual interpretation rule:

- benchmark conclusions should remain grounded in locator-family pass/fail behavior and oracle outcomes, with accessibility used only as contextual support for semantic-locator degradation analysis
