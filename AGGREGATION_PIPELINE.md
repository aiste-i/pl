# Benchmark Aggregation & Reporting Pipeline

## 1. Overview
The aggregation subsystem is a post-processing pipeline that transforms individual benchmark run results (JSON) into a normalized dataset and statistical summaries (CSV/JSON). Its primary goal is to provide deterministic, thesis-ready metrics for locator robustness, execution timing, and accessibility impact.

## 2. Codebase Map
- **Main Engine**: `src/murun/runner/aggregate.ts`
  - Handles recursive file discovery, record validation, normalization, and serialization.
- **Validation Suite**: `tests/AggregationValidation.spec.ts`
  - Automates verification of denominator isolation, invalid-run filtering, and mathematical accuracy.
- **Data Source**: `test-results/<app-name>/benchmark-runs/*.json`
  - Per-run records produced by the `tests/baseFixture.ts` execution harness.

## 3. End-to-End Aggregation Flow
1. **Discovery**: Recursively walks the input directory for `.json` files. Files containing `axe.json` (detailed accessibility artifacts) are explicitly ignored.
2. **Rejection**: Each file is parsed. Records missing `runId`, `locatorFamily`, or `phase` are skipped with a warning.
3. **Filtering**: Records with `runStatus: 'invalid'` (infrastructure or setup failures) are purged from all analysis populations.
4. **Normalization**: Nested accessibility metrics are flattened to the root. Legacy records missing `changeCategory` or `durationMs` receive derived or defaulted values.
5. **Aggregation**: The script calculates summary statistics grouped by `locatorFamily` and `phase`.
6. **Serialization**: Data is written to six specialized CSV files and one JSON report.

## 4. Full Input Schema
The aggregator processes JSON records containing the fields below. Fields marked **Mandatory** result in record rejection if absent.

| Field Name | Type | Aggregator Treatment | Source | Result if Missing |
| :--- | :--- | :--- | :--- | :--- |
| `runId` | string | **Mandatory.** Rejects if missing. | baseFixture | Record skipped with warning |
| `locatorFamily` | string | **Mandatory.** Rejects if missing. | baseFixture | Record skipped with warning |
| `phase` | string | **Mandatory.** Rejects if missing. | baseFixture | Record skipped with warning |
| `runStatus` | string | **Expected.** | baseFixture | Treated as not passed/failed |
| `applicationId` | string | Preserved. | baseFixture | Set to `unknown` |
| `scenarioId` | string | Preserved. | baseFixture | Set to `unknown` |
| `semanticEntryPoint`| string | Preserved. | baseFixture | Set to `none` |
| `failureClass` | string | Preserved. | FailureClassifier | Set to `none` |
| `changeId` | string | Preserved. | WebMutator | Set to `none` |
| `changeOperator` | string | Preserved. | WebMutator | Set to `none` |
| `changeCategory` | string | **Derived.** | MutantGenerator | Derived from `changeOperator` map |
| `durationMs` | number | **Defaulted.** | baseFixture | Set to `0` |
| `accessibility` | object | **Flattened.** | Axe-Playwright | Nested metrics set to `0` |

## 5. Data Normalization Model
Before aggregation, nested structures are flattened into a standard 15-column row model.
**Normalized Columns (in order):**
1. `runId`, 2. `applicationId`, 3. `scenarioId`, 4. `locatorFamily`, 5. `semanticEntryPoint`, 6. `phase`, 7. `runStatus`, 8. `failureClass`, 9. `changeId`, 10. `changeCategory`, 11. `changeOperator`, 12. `durationMs`, 13. `totalViolations`, 14. `criticalViolations`, 15. `impactedNodes`.

## 6. Malformed and Incomplete Input Handling
The script applies the following rules when encountering incomplete or inconsistent records.

| Condition | Aggregator Behavior | Analytical Consequence |
| :--- | :--- | :--- |
| `runId`, `locatorFamily`, or `phase` missing | **Reject.** Warns and skips file. | Run is omitted from all datasets. |
| `runStatus` missing or unexpected | **Keep.** Processed as is. | Row excluded from passed/failed metrics. |
| `failureClass` missing on `failed` run | **Keep.** Defaulted to `none`. | Categorized as `none` in distribution CSV. |
| `changeOperator` missing | **Keep.** Defaulted to `none`. | Category becomes `unknown`. |
| `changeOperator` unknown to map | **Keep.** Category set to `unknown`. | Category summaries underrepresent this op. |
| `durationMs` missing | **Keep.** Defaulted to `0`. | Deflates mean/median timing metrics. |
| `accessibility` block missing/malformed | **Keep.** Violations set to `0`. | Deflates accessibility mean violation metrics. |
| JSON unreadable / parse failure | **Reject.** Warns and skips file. | Run is omitted from all datasets. |

## 7. Metric Computation Model
- **Failure Rate (Mutated)**: `count(failed_mutated) / count(total_mutated)`. Excludes Baseline and Invalid runs.
- **Failure Proportion**: `count(mutated_failed_class_X) / count(mutated_failed_total)` (per family).
- **Baseline Pass Rate**: `count(passed_baseline) / count(total_baseline)`.
- **Mean Duration**: `sum(durationMs) / count(mutated_total)`. Excludes baseline.

## 8. Accessibility Aggregation and Data Distortion Rules
The aggregator **does not inspect `scanStatus`** (completed/failed/skipped).
- `accessibility_summary.csv` includes all non-invalid runs that survive normalization, regardless of accessibility scan outcome.
- Because the aggregator ignores `scanStatus` and defaults missing accessibility metrics to zero-like values, failed, skipped, and missing accessibility records depress the reported means.
- **Analytical Rule**: These summaries represent **lower-bound values**. High scan failure rates will artificially lower the accessibility impact reported in the thesis.

## 9. Output Files and Exact Schemas

### `benchmark_runs.csv`
- **Granularity**: Single benchmark run.
- **Inclusion**: Baseline + Mutated included. Invalid excluded.
- **Columns**: `runId`, `applicationId`, `scenarioId`, `locatorFamily`, `semanticEntryPoint`, `phase`, `runStatus`, `failureClass`, `changeId`, `changeCategory`, `changeOperator`, `durationMs`, `totalViolations`, `criticalViolations`, `impactedNodes`.
- **Caveats**: Accessibility metrics are zero-defaulted for failed scans. Legacy timing is `0ms`.

### `summary_by_family.csv`
- **Granularity**: Locator Family.
- **Inclusion**: Baseline + Mutated included. Invalid excluded.
- **Columns**: `family`, `totalRuns`, `mutatedRuns`, `failedMutatedRuns`, `failureRateMutated`, `baselinePassRate`, `meanDurationMs`, `medianDurationMs`.

### `summary_by_family_and_category.csv`
- **Granularity**: Family + Change Category.
- **Inclusion**: Mutated only. Invalid excluded.
- **Columns**: `family`, `category`, `totalMutated`, `failedMutated`, `failureRate`, `meanDuration`, `meanViolations`.

### `summary_by_family_and_operator.csv`
- **Granularity**: Family + Mutation Operator.
- **Inclusion**: Mutated only. Invalid excluded.
- **Columns**: `family`, `operator`, `totalMutated`, `failedMutated`, `failureRate`.

### `failure_distribution.csv`
- **Granularity**: Family + Failure Class.
- **Inclusion**: Failed mutated runs only. Invalid excluded.
- **Columns**: `family`, `failureClass`, `count`, `proportion`.

### `accessibility_summary.csv`
- **Granularity**: Locator Family.
- **Inclusion**: Baseline + Mutated included. Invalid excluded.
- **Columns**: `family`, `meanViolationsBaseline`, `meanViolationsMutated`, `meanCriticalMutated`, `meanImpactedNodesMutated`.
- **Caveats**: Metrics are distorted by failed scans (treated as 0).

## 10. Machine-Readable Report (`aggregate_report.json`)
A structured summary for programmatic consumption. 
- `benchmark_runs.csv` has **no equivalent** in this report.
- `summary_by_family_and_operator.csv` has **no equivalent** in this report.

**Keys and Object Schemas:**
- `generatedAt` (string): ISO timestamp.
- `summaryByFamily` (Array<Object>): `family`, `totalRuns`, `mutatedRuns`, `failedMutatedRuns`, `failureRateMutated`, `baselinePassRate`, `meanDurationMs`, `medianDurationMs`.
- `summaryByFamilyCategory` (Array<Object>): `family`, `category`, `totalMutated`, `failedMutated`, `failureRate`, `meanDuration`, `meanViolations`.
- `failureDistribution` (Array<Object>): `family`, `failureClass`, `count`, `proportion`.
- `accessibility` (Array<Object>): `family`, `meanViolationsBaseline`, `meanViolationsMutated`, `meanCriticalMutated`, `meanImpactedNodesMutated`.

## 11. CLI Usage and Execution Behavior
**Syntax**: `npx ts-node src/murun/runner/aggregate.ts <input_dir> <output_dir>`
- **Discovery**: Recursive search. Ignores `axe.json` files.
- **Directory Handling**: Auto-creates output directory. Overwrites CSV/JSON outputs.
- **Exit Codes**: `1` if no valid records found; `0` if aggregation finishes.

## 12. Validation and Tests
**Verification Suite**: `tests/AggregationValidation.spec.ts`
- **Logic Verified**: Mutated failure rate denominators exclude baseline passes; `invalid` runs are purged from averages; proportions sum correctly.
- **Verification Gaps**: Legacy mapping accuracy and CSV string escaping are `not verifiable from current implementation evidence`.

## 13. Analytical Limitations and Residual Risks
- **Legacy Timing Distortion**: Mixed datasets containing `durationMs = 0` legacy defaults will deflate timing conclusions. Final thesis analysis should prefer regenerated records.
- **Category Drift**: New mutation operators must be manually added to the `CATEGORY_MAPPING` in `aggregate.ts` or they will be grouped as `unknown`.
- **A11y Precision**: Undercounting caused by ignoring `scanStatus` means deltas are conservative approximations.
