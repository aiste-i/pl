# Playwright UI Mutation Framework

This project allows for mutation testing of UI elements in a Playwright environment, specifically focusing on accessibility and semantic locator stress.

## Available Scripts

### 1. Baseline Run
Runs the standard test suite without any mutations or target collection.
```bash
npm run test:baseline
```

### 2. Prepare Mutation Scenarios
Runs the baseline tests while collecting reachable DOM elements, then generates and samples mutation scenarios (saved to `test-results/todomvc/scenarios.json`).
```bash
npm run mutate:prepare
```

### 3. Mutated Run
Runs the test suite with the generated mutation scenarios injected. Each scenario is applied before the test logic starts to check if the test can still pass (detecting the mutation).
```bash
npm run test:mutate
```

## How it Works

1.  **Baseline Collection:** The `COLLECT_TARGETS=true` environment variable triggers `baseFixture.ts` to use `MutantGenerator` to harvest all reachable targets (buttons, inputs, links, headings, etc.) after each test.
2.  **Scenario Generation:** `generate-scenarios.ts` takes the collected targets and applies all registered `DomOperators` to them to see which mutations are applicable, then samples them based on a budget.
3.  **Mutation Injection:** When `test:mutate` is run, it loads `scenarios.json`. The `TodoMVC.spec.ts` dynamically creates `test.describe` blocks for each scenario. The `baseFixture.ts` applies the chosen mutation to the page *before* the test logic executes.
`n## Aggregation`n`nAfter running the benchmark tests, you can aggregate the results into CSV summaries for analysis:`n`n```bash`nnpx ts-node src/murun/runner/aggregate.ts <input_results_dir> <output_dir>`n````n`nExample:`n```bash`nnpx ts-node src/murun/runner/aggregate.ts test-results/default/benchmark-runs/ reports/`n````n`nThis will generate:`n- benchmark_runs.csv: Flat list of all valid runs.`n- summary_by_family.csv: Aggregated metrics per locator family.`n- summary_by_family_and_category.csv: Aggregated metrics per family and change category.`n- failure_distribution.csv: Distribution of failure classes.`n- accessibility_summary.csv: Axe-core violation summaries.`n- aggregate_report.json: Machine-readable summary.
