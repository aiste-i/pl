# Thesis Note: Supplementary RealWorld Semantic Corpus Correction

The primary RealWorld corpus remains unchanged and continues to define the main thesis benchmark denominator. The supplementary `realworld-semantic-supplement` corpus remains separate and is not pooled into the main benchmark.

Supplement reporting is scoped to supplement rows from the semantic-first family. Query distribution, scenario-to-query mapping, semantic-query summaries, and semantic failure distributions are computed from supplement-relevant semantic-first evidence rather than CSS, XPath, reachable-target bookkeeping, or main-corpus rows.

A deterministic supplement-only Stage 0 coverage pass ensures each supported app/scenario pair receives at least one mutated semantic-first candidate when a valid candidate exists. If no valid candidate exists after supplement preflight, the scenario is reported explicitly as baseline-supported with no valid mutated candidate.

A combined supplement-level aggregate is emitted separately from app-level debug aggregates so the supplementary semantic evidence can be interpreted without merging it into the primary thesis dataset. The combined aggregate now requires complete evidence for every app that supports at least one supplement scenario; incomplete or mixed-corpus inputs fail before a thesis-facing aggregate is written.

These corrections improve semantic-family interpretability only. The main thesis benchmark, main denominator logic, operator-diversity policy, three-family comparison contract, and oracle purity boundary are not changed.

Suggested thesis wording:

> The supplementary semantic corpus remained methodologically separate from the main RealWorld benchmark. Its combined aggregate was corrected to summarize all supported supplement scenarios across all supported apps, while semantic reports were scoped to supplement-relevant semantic-first evidence with baseline support separated from mutated evidence. These changes did not alter the main thesis benchmark or its denominators.
