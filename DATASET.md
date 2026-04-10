# Dataset Specification

This file defines the output contract for the Playwright RealWorld locator-robustness benchmark.

## Purpose And Scope

The dataset records run-level evidence for comparing exactly three benchmarked locator families:

- `semantic-first`
- `css`
- `xpath`

Oracle locators are separate and excluded from comparison. Chromium is the thesis-primary browser dimension. Firefox and WebKit records are first-class dataset dimensions when cross-browser generation is explicitly requested.

## Versions

- `schemaVersion` tracks structural JSON contract changes.
- `datasetVersion` tracks analysis-affecting changes, including field meaning changes, aggregation semantics, mutation taxonomy changes, or browser-dimension changes.

Current versions are defined in `src/benchmark/result-contract.ts`.

Backward-compatible schema additions should bump `schemaVersion` only. Changes that alter interpretation of results must bump `datasetVersion`.

## Artifact Types

Run-level records:

- One JSON object per scenario/family/browser/mutation run.
- Written under `test-results/<app-id>/realworld-active/benchmark-runs`.
- Mirrored to `artifacts/<run-id>/results.json`.

Aggregate records:

- CSV and JSON summaries under `test-results/<app-id>/realworld-active/aggregate`.
- Aggregation validates structured records before consuming them.

Accessibility artifacts:

- Detailed axe output under `test-results/<app-id>/realworld-active/accessibility-artifacts`.
- Linked from run records through `accessibility.artifactPath` and `axeArtifactPath`.

Optional evidence artifacts:

- `tracePath`
- `screenshotPath`
- `axeArtifactPath`
- `ariaSnapshotPath`

These may be `null` when the artifact is not produced.

## JSON Field Dictionary

Top-level identity:

- `schemaVersion`: structural schema version.
- `datasetVersion`: analysis dataset version.
- `generatedAt`: ISO timestamp for the record.
- `commitSha`: Git commit SHA, or `unknown` when unavailable.
- `gitBranch`: Git branch when available.
- `dirtyWorkingTree`: local dirty-state flag when available.
- `nodeVersion`: Node runtime version.
- `playwrightVersion`: Playwright package version.
- `benchmarkPackageVersion`: repository package version.
- `platform`: object containing `os`, `platform`, `release`, and `arch`.

Run dimensions:

- `runId`: unique run identifier.
- `applicationId`: app under test.
- `corpusId`: benchmark corpus, usually `realworld-active`.
- `scenarioId`: Playwright title path for the executed test.
- `activeScenarioId`: stable scenario ID from the active corpus.
- `activeScenarioCategory`: scenario category from the corpus manifest.
- `sourceSpec`: original source spec for traceability.
- `locatorFamily`: one of `semantic-first`, `css`, or `xpath`.
- `semanticEntryPoint`: semantic API entry point when observable.
- `browserName`: one of `chromium`, `firefox`, or `webkit`.
- `browserChannel`: Playwright browser channel when configured, otherwise `null`.

Mutation metadata:

- `phase`: `baseline` or `mutated`.
- `mutation.mutationId`: selected mutation ID, or `baseline`.
- `mutation.operatorId`: operator class name, or `none`.
- `mutation.operatorCategory`: `structural`, `content`, `accessibility-semantic`, `visibility`, `visibility-interaction-state`, or `none`.
- `mutation.candidateId`: selected candidate ID when mutated.
- `mutation.seed`: selection seed when known.
- `mutation.selected`: whether a mutation was selected for this run.
- `mutation.applied`: whether the mutation was applied successfully.
- `mutation.skipped`: whether the selected mutation was skipped or rejected.
- `mutation.skipReason`: stable reason such as `oracle-protected`, `target-not-found`, `behavior-preservation-gate-failed`, `operator-applicability-error`, `checkpoint-not-reached`, or `setup-failure`.

Legacy-compatible mutation aliases:

- `changeId`
- `changeCategory`
- `changeOperator`
- `quotaBucket`

These remain for aggregate compatibility. Prefer `mutation.*` for new analysis.

Outcome fields:

- `runStatus`: `passed`, `failed`, or `invalid`.
- `failureClass`: `NO_MATCH`, `MULTIPLE_MATCH`, `ACTIONABILITY`, `ASSERTION`, or `null`.
- `failureStage`: `ORACLE_PRECHECK`, `ACTION`, `ASSERTION`, or `null`.
- `durationMs`: wall-clock duration.
- `instrumentationPathUsed`: `structured`, `fallback`, or `mixed`.
- `comparisonEligible`: whether the record contributes to family comparison denominators.
- `comparisonExclusionReason`: exclusion reason when not eligible.
- `invalidRunReason`: reason for invalid harness/setup/oracle records.

Evidence fields:

- `oracleIntegrityOk`: oracle precondition status.
- `oracleIntegrityError`: oracle failure details when present.
- `evidence.*`: structured action/assertion/classifier booleans used by failure classification.
- `rawErrorName`, `rawErrorMessage`, `classifierReason`, `isTimeout`, and `isStrictnessViolation`: failure-classifier details when applicable.

Accessibility:

- `accessibility.scanAttempted`: whether an axe scan was attempted.
- `accessibility.scanStatus`: `completed`, `failed`, or `skipped`.
- `accessibility.scanError`: failure message when scan failed.
- `accessibility.totalViolations`: number of axe violations.
- `accessibility.violationIds`: axe violation IDs.
- `accessibility.impactedNodeCount`: total impacted nodes across violations.
- `accessibility.artifactPath`: detailed axe artifact path, or `null`.
- `accessibility.stabilization`: page stabilization attempt, status, duration, and strategy.
- `criticalCount`, `seriousCount`, `moderateCount`, `minorCount`: violation impact counts.

Run metadata:

- `artifacts/<run-id>/run-metadata.json` records schema and dataset versions, Git state, Node/npm/Playwright versions, OS/platform/arch, browser set, corpus ID, selected scenarios/apps, seeds, mutation budget, selected mutation IDs, execution mode, and CI context.

## CSV Columns

Run-level `results.csv` contains a flattened single-row subset:

- identity: `schemaVersion`, `datasetVersion`, `runId`, `generatedAt`, `commitSha`
- dimensions: `applicationId`, `corpusId`, `scenarioId`, `activeScenarioId`, `locatorFamily`, `browserName`, `browserChannel`
- outcome: `phase`, `runStatus`, `failureClass`, `durationMs`, `instrumentationPathUsed`, `comparisonEligible`, `comparisonExclusionReason`
- mutation: `mutationId`, `operatorId`, `operatorCategory`, `candidateId`, `seed`, `mutationSelected`, `mutationApplied`, `mutationSkipped`, `mutationSkipReason`
- accessibility: `accessibilityScanAttempted`, `accessibilityScanStatus`, `accessibilityTotalViolations`, `accessibilityImpactedNodeCount`, `accessibilityArtifactPath`
- optional evidence paths: `tracePath`, `screenshotPath`, `axeArtifactPath`, `ariaSnapshotPath`

Aggregate CSVs include:

- `benchmark_runs.csv`: run-level rows consumed by analysis.
- `summary_by_family.csv`: family-level summaries.
- `summary_by_browser.csv`: browser-level summaries.
- `summary_by_browser_and_family.csv`: browser/family summaries.
- `summary_by_browser_family_and_category.csv`: browser/family/mutation-category summaries.
- `summary_by_family_and_category.csv`: family/category summaries.
- `summary_by_family_and_operator.csv`: family/operator summaries.
- `failure_distribution.csv`: failure taxonomy distribution.
- `comparison_denominators.csv`: denominator and exclusion accounting.
- `accessibility_summary_completed_only.csv`: completed-scan accessibility summary.
- `accessibility_summary_all_valid_runs.csv`: scan coverage over all valid runs.
- `mutation_run_telemetry.csv`: selected mutation telemetry.
- `operator_telemetry_summary.csv`: operator-level telemetry.

## Failure Taxonomy

- `NO_MATCH`: tested locator failed to resolve to an element.
- `MULTIPLE_MATCH`: tested locator resolved to multiple elements.
- `ACTIONABILITY`: tested locator resolved but could not act because of visibility, disabled state, detachment, or timeout.
- `ASSERTION`: action completed but oracle postcondition failed.
- `invalid`: infrastructure, setup, mutation application, or oracle-integrity records that must not be interpreted as locator-family failures.

## Mutation Taxonomy

- `structural`: DOM structure changes that preserve the benchmark task.
- `content`: text/content changes.
- `accessibility-semantic`: ARIA or semantic HTML changes.
- `visibility-interaction-state`: visibility or interaction-state changes represented at runtime as `visibility`.
- `visual`: excluded by design from the benchmark comparison.

Operators expose explicit applicability checks. Oracle-protected targets and behavior-preservation gate failures are recorded as stable skip reasons.

## Comparison Eligibility

`comparisonEligible` controls inclusion in locator-family denominators. A record can be excluded because:

- the mutation could not be applied safely,
- the mutation target was oracle-protected,
- the scenario checkpoint was not reached,
- the run was invalid infrastructure/setup evidence,
- the locator key is unsupported for aggregate comparison.

Invalid and excluded records remain in the dataset for auditability.

## Accessibility Semantics

`scanStatus: "completed"` means axe produced violation data.

`scanStatus: "failed"` means scan execution failed; use `scanError`.

`scanStatus: "skipped"` means the scan was intentionally not run, usually because setup or mutation application invalidated the record.

Completed-scan-only summaries answer "what violations were found when scan evidence exists." All-valid-run summaries answer "how much scan evidence was available." Treat accessibility counts as lower bounds when scan failures or skips exist.

## Browser Dimension

`browserName` is a structured dimension in JSON, CSV, aggregation, and metadata. Valid values are `chromium`, `firefox`, and `webkit`.

Chromium records are thesis-primary by default. Firefox and WebKit are supplementary unless a cross-browser dataset is explicitly declared.

## Seed Semantics

Mutation selection is deterministic for the tuple:

- candidate pool
- budget
- seed
- category quota policy

Candidate ordering is normalized by deterministic rank, so object insertion order and filesystem ordering do not affect selected mutation IDs.

## Privacy And Security

Playwright traces may contain DOM snapshots, URLs, storage state, and network data. Traces should not be uploaded by default.

Screenshots, axe artifacts, and ARIA snapshots may contain app state. Treat artifacts as reviewer evidence, not public telemetry, unless they have been inspected.

## Analysis Caveats

- Do not mix Chromium thesis-primary claims with multi-browser claims unless browser grouping is explicit.
- Use `comparisonEligible` denominators for locator-family failure-rate analysis.
- Keep oracle failures and infrastructure invalids out of locator-family failure counts.
- Accessibility summaries should report both completed-scan-only means and scan coverage across all valid runs.
- Legacy fields such as `changeId` and `changeOperator` are retained for compatibility; new analysis should prefer `mutation.*`.
