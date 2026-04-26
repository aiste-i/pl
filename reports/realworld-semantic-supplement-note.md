# Thesis Note: Supplementary RealWorld Semantic Corpus Correction

The primary RealWorld corpus remains unchanged and continues to define the main thesis benchmark denominator. The supplementary `realworld-semantic-supplement` corpus remains separate and is not pooled into the main benchmark.

Supplement reporting is scoped to supplement rows from the semantic-first family. Query distribution, scenario-to-query mapping, semantic-query summaries, and semantic failure distributions are computed from supplement-relevant semantic-first evidence rather than CSS, XPath, reachable-target bookkeeping, or main-corpus rows.

A deterministic supplement-only Stage 0 coverage pass ensures each supported app/scenario pair receives at least one mutated semantic-first candidate when a valid candidate exists. If no valid candidate exists after supplement preflight, the scenario is reported explicitly as baseline-supported with no valid mutated candidate.

The supplement now has one canonical thesis-facing aggregate at `test-results/realworld-semantic-supplement/thesis-facing-aggregate/`. App-level supplement aggregates are retained only under debug paths for engineering inspection, and older misleading supplement aggregate paths are removed or explicitly demoted to deprecated/debug locations.

The canonical supplement aggregate is semantic-first supplementary coverage evidence, not a second primary benchmark or a symmetric mixed-family comparison report. It preserves baseline support and mutated evidence as separate views, requires complete evidence for every app that supports at least one supplement scenario, and fails before writing a thesis-facing aggregate when inputs are incomplete or mixed with main-corpus rows.

These corrections improve semantic-family interpretability only. The main thesis benchmark, main denominator logic, operator-diversity policy, three-family comparison contract, and oracle purity boundary are not changed.

Suggested thesis wording:

> The supplementary semantic corpus remained methodologically separate from the main RealWorld benchmark. It now has a single canonical thesis-facing aggregate that summarizes all supported supplement scenarios across all supported apps using supplement-relevant semantic-first evidence, with baseline support separated from mutated evidence. Older app-level or legacy supplement aggregates are debug/noncanonical only. These changes did not alter the main thesis benchmark or its denominators.
