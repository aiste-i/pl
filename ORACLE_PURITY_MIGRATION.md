# Oracle Purity Migration Note

Date: 2026-04-05

## What Changed

The RealWorld benchmark oracle layer was tightened so benchmark-active oracle resolution now uses `getByTestId()` chains only.

Main changes:

- text-based narrowing of repeated entities was removed from benchmark-active oracle helpers
- repeated comment cards are now addressed through stable id-based test ids such as `comment-card-<id>`
- nested oracle actions such as comment deletion now use chained `getByTestId()` lookups instead of text or semantic fallbacks
- runtime mutation safety protects oracle roots and oracle-critical ancestors from mutation
- static validation now fails if oracle modules reintroduce text filtering or non-test-id oracle resolution

## Why It Changed

The thesis benchmark compares locator families. Oracle locators are a separate ground-truth layer and must stay stable under the same UI changes being studied. If oracle code depends on visible text, semantic queries, CSS, or XPath, the benchmark can no longer cleanly distinguish:

- benchmark locator failure
- oracle drift
- mutation side-effects on verification logic

Pure test-id grounded oracles keep target selection, postcondition checks, and mutation safety deterministic and methodologically interpretable.

## Practical Impact

- comment creation and deletion checks now follow the exact created comment id
- repeated-item assertions no longer depend on visible text surviving mutation
- future oracle regressions are caught by `tests/realworld-validation/OraclePurity.spec.ts`
