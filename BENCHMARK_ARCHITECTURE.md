# Benchmark Architecture

## Core Modules

- `src/apps/*`: app registry, route adapters, startup wiring, per-app benchmark metadata
- `src/benchmark/realworld-corpus.ts`: thesis-active corpus definition and source-spec disposition matrix
- `src/locators/apps/*`: per-app implementations for `semantic-first`, `css`, `xpath`, and `oracle`
- `src/locators/realworld/*`: shared logical keys, coverage metadata, unsupported-family reporting
- `tests/realworld/benchmark-active.scenarios.ts`: shared benchmark-active scenario definitions
- `tests/realworld/helpers/*`: scenario support code kept constant across locator families
- `tests/baseFixture.ts`: run harness, mutation application, oracle verification, result serialization
- `src/webmutator/*`: mutation operators, registry, oracle-safety checks, mutation execution
- `src/murun/runner/*`: scenario generation and aggregation

## Comparison Boundary

The benchmark compares locator robustness at the family level:

- `semantic-first`
- `css`
- `xpath`

The oracle layer is independent and not benchmarked. It exists only to ground postconditions and target verification.

Benchmark rules enforced by implementation and validation:

- scenario logic is shared across families
- only locator resolution changes by family
- `semantic-first` begins with a semantic Playwright query
- `css` stays CSS-only
- `xpath` stays XPath-only
- oracle resolution uses `getByTestId()` chains only
- unsupported or excluded cases remain visible in reports instead of being hidden by fallback logic

## Active Corpus

The executable corpus is `realworld-active`.

Entrypoint:

- [`tests/realworld/benchmark-active.spec.ts`](/c:/Users/aiste/Desktop/benchmark/tests/realworld/benchmark-active.spec.ts)

Scenario definitions:

- [`tests/realworld/benchmark-active.scenarios.ts`](/c:/Users/aiste/Desktop/benchmark/tests/realworld/benchmark-active.scenarios.ts)

The corpus currently contains 12 migrated shared scenarios spanning:

- auth
- articles
- comments
- navigation
- settings
- social

Every RealWorld source spec now has an explicit disposition:

- `migrated`
- `excluded-by-design`
- `excluded-methodological`

There is no remaining temporary migration-debt state in the corpus manifest.

Machine-readable corpus artifacts:

- [`reports/realworld-benchmark-corpus.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-benchmark-corpus.json)
- [`reports/realworld-migration-matrix.json`](/c:/Users/aiste/Desktop/benchmark/reports/realworld-migration-matrix.json)

## Oracle Layer

Oracle locators are implemented in the per-app locator modules through helper wrappers in [`src/locators/apps/shared-realworld.ts`](/c:/Users/aiste/Desktop/benchmark/src/locators/apps/shared-realworld.ts).

Allowed oracle shape:

- `getByTestId('...')`
- `getByTestId('...').getByTestId('...')`
- dynamic `getByTestId()` addressing for repeated entities such as comment cards and pagination items

Disallowed oracle shape:

- text filtering
- `getByText(...)`
- semantic fallbacks
- CSS or XPath roots
- generic `page.locator(...)` oracle resolution

Oracle-safety is enforced in two places:

- static validation of oracle source code
- runtime mutation skipping for oracle nodes and oracle-critical ancestors

## Mutation Pipeline

Execution flow for one app:

1. baseline run against `realworld-active`
2. reachable-target collection
3. deterministic mutation-scenario generation
4. mutated re-execution
5. aggregation into CSV and JSON summaries

In-scope operators are registered through the shared catalog in [`src/webmutator/operators/catalog.ts`](/c:/Users/aiste/Desktop/benchmark/src/webmutator/operators/catalog.ts), which records:

- implementation kind
- thesis taxonomy category
- benchmark scope
- exclusion reason where applicable

The catalog explicitly distinguishes:

- in-scope DOM/accessibility operators
- excluded-by-design visual operators

## Reports And Auditability

The architecture produces machine-readable artifacts for the main methodological surfaces:

- corpus and source-spec disposition
- locator support and unsupported coverage
- semantic CSS exceptions
- operator taxonomy and operator coverage
- pipeline verification and workflow presence

Generated report entrypoints:

- [`scripts/generate-realworld-corpus-report.ts`](/c:/Users/aiste/Desktop/benchmark/scripts/generate-realworld-corpus-report.ts)
- [`scripts/generate-operator-reports.ts`](/c:/Users/aiste/Desktop/benchmark/scripts/generate-operator-reports.ts)
- [`scripts/generate-pipeline-verification.ts`](/c:/Users/aiste/Desktop/benchmark/scripts/generate-pipeline-verification.ts)

## Execution Environments

Primary thesis environment:

- Chromium on Linux

Supplementary engineering evidence:

- Firefox smoke coverage
- WebKit smoke coverage

The architecture keeps that distinction explicit in scripts, CI, and generated reports so cross-browser evidence strengthens reproducibility without silently changing the thesis claim boundary.

## CI Design

PR workflow:

- install dependencies
- install Chromium
- run lint
- run typecheck
- run methodological validation specs
- run Chromium baseline corpus
- run report freshness check

Scheduled workflow:

- install Chromium, Firefox, and WebKit
- rerun validation specs
- execute cross-browser baseline smoke
- prepare one deterministic mutation sample per app
- execute Chromium mutation sample
- aggregate outputs and upload artifacts

## Compatibility Rule

The RealWorld applications are benchmark subjects, not benchmark implementations. App-side edits are limited to:

- cross-app parity fixes needed for comparable flows
- stable `data-testid` hooks required for pure oracle grounding
- benchmark-neutral UI affordances that preserve the intended user task

The system does not optimize for green runs by weakening locator-family purity, oracle purity, or mutation interpretability.
