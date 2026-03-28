# Mutation Testing Framework for Web Applications

This framework provides an autonomous way to generate, save, and reuse mutation scenarios for web applications using Playwright. It is used for benchmarking locator robustness under UI changes.

## Locator Comparison Design

The benchmark compares three main locator families:
- **semantic-first**: The first resolving step must use a Playwright semantic API (`getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`, `getByAltText`, `getByTitle`).
- **css**: CSS-only locators.
- **xpath**: XPath-only locators.

## Instrumentation Enforcement

The benchmark enforces instrumented actions through an architectural wrapper. Benchmark specs use the `locators` and `oracle` fixture objects, which return `BenchmarkedLocator` and `OracleLocator` instances. These wrappers automatically route all interactions (click, fill, etc.) and assertions through the evidence-capture layer.

### Result Traceability
The `instrumentationPathUsed` field in the result schema indicates the quality of the classification:
- `structured`: All actions were routed through the Enforcement Layer.
- `mixed` or `fallback`: Some actions bypassed the wrappers, resulting in weaker inference.

## Oracle Safety Policy

The framework implements a coherent oracle-safety policy to prevent the mutation of ground-truth references.

### Protected Nodes
- **Oracle Nodes**: Any node containing the `data-testid` attribute.
- **Oracle Context/Ancestors**: Any node that is an ancestor of an oracle node.

### Enforcement
1. **Target Selection**: The `MutantGenerator` explicitly excludes all protected nodes from the reachable target pool.
2. **Operator Preconditions**: Every mutation operator (e.g., `SubtreeDelete`, `StyleVisibility`, `AttributeMutator`) performs an `OracleSafety.isProtected` check before application.
3. **Restricted Operations**: 
   - Destructive structural operators (`SubtreeDelete`, `SubtreeMove`, `SubtreeSwap`) are forbidden from operating on subtrees containing oracle nodes.
   - Visibility/State operators are forbidden from hiding oracle context.

## Result Schema

```json
{
  "runId": "12610d0d-a64a-4052-9af1-d34a29621b55",
  "applicationId": "todomvc",
  "locatorFamily": "semantic-first",
  "runStatus": "failed",
  "failureClass": "ACTIONABILITY",
  "instrumentationPathUsed": "structured",
  "accessibility": {
    "scanAttempted": true,
    "scanStatus": "completed",
    "scanTimestamp": "2026-03-12T17:48:06.379Z",
    "scanError": null,
    "detailedArtifactWritten": true,
    "artifactPath": "test-results/todomvc/accessibility-artifacts/..._axe.json",
    "totalViolations": 4,
    "violationIds": ["label", "button-name"],
    "impactedNodeCount": 12,
    "runId": "12610d0d-a64a-4052-9af1-d34a29621b55",
    "stabilization": {
      "attempted": true,
      "status": "completed",
      "durationMs": 450,
      "strategy": "networkidle + requestAnimationFrame + 200ms"
    }
  }
}
```

## Accessibility Integration

The benchmark includes automated accessibility scanning using `axe-core`.

### Scan Timing & Stabilization Traceability
Scans run in the `finally` block at the scenario end state. The `stabilization` object records the outcome of the multi-stage stabilization strategy:
- `completed`: Successfully stabilized.
- `timeout-fallback`: Stabilized with some timeouts (e.g., persistent network activity).
- `skipped`: Stabilization not attempted.

### Scan Status Semantics
The `scanStatus` field provides deterministic evidence:
- **`completed`**: Scan attempted and finished successfully. Summary fields are populated.
- **`failed`**: Scan attempted but crashed or was blocked (e.g., page closed). `scanError` contains the reason.
- **`skipped`**: Scan intentionally not run (e.g., if the benchmark run was invalid due to setup failure before navigation).

### Artifact Linkage & Metadata
- **Unambiguous Linkage**: Each run is linked via a unique `runId`.
- **Self-Describing Artifacts**: Detailed Axe JSON files contain full mirrored metadata (application, scenario, family, phase, change info, run status) for standalone analysis.
- **Normalized Paths**: `artifactPath` uses POSIX-style forward slashes for cross-platform stability.

### Status Independence
Accessibility `scanStatus` is independent of benchmark `runStatus`. A benchmark failure (e.g., `NO_MATCH`) can still produce a `completed` accessibility scan of the failure state.
