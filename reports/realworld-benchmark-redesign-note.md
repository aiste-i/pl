# RealWorld Benchmark Redesign Note

## Idiomatic CSS

In this benchmark, idiomatic CSS means using the shortest maintainable selector that a practitioner would realistically keep:

- concise class-token combinations
- direct attribute selectors
- local container scoping
- direct child or sibling combinators only when that structure is intentionally part of the locator contract
- readable selectors that stay on the target surface instead of recreating a deep XPath path in CSS syntax

Idiomatic CSS in this redesign avoids long descendant chains, pseudo-positional tricks, and XPath-like structural transliterations when a shorter class or attribute anchor exists.

## Idiomatic XPath

In this benchmark, idiomatic XPath means using XPath where its native strengths are actually useful:

- ancestor or descendant context
- axis navigation
- relative predicates inside repeated containers
- normalized text when text is intentionally part of the strategy
- relational context that CSS expresses poorly or less clearly

Idiomatic XPath in this redesign avoids absolute page-root paths, pointless copies of short CSS selectors, and brittle positional predicates that no maintainer would intentionally keep.

## Why CSS and XPath Are No Longer Treated as Syntax Twins

The benchmark no longer assumes that fair comparison means CSS and XPath should resolve through the same selector surface. That previous habit made equal CSS/XPath outcomes too easy to explain as a benchmark artifact. The redesign instead keeps the same logical target and benchmark family boundary, but lets each family use the strongest native expression available for that target.

This makes a CSS/XPath tie more defensible:

- if CSS and XPath still behave similarly, the result is less likely to be caused by accidental transliteration
- if they diverge, the benchmark can explain that divergence through actual surface differences

## Deterministic Operator-Diverse Sampler

The sampler is now fixed benchmark policy rather than configurable behavior.

Within each mutation category:

1. applicable candidates are partitioned by operator
2. Stage 1 selects exactly one candidate for each operator that has at least one applicable candidate, using deterministic seeded ordering
3. Stage 2 fills any remaining category quota by repeatedly selecting from the operator with the lowest selected/applicable ratio, with deterministic seeded tie-breaking

This preserves determinism while ensuring that operator diversity is part of the method itself.

## Why the Sampler Is Fixed Policy

Configurable diversity knobs would weaken the methodology because reviewers could reasonably ask whether the benchmark outcome depended on hand-tuned thresholds or preferred operator lists. The redesigned sampler therefore hard-codes operator coverage first and ratio-based fill second. The benchmark claim is now about one explicit policy, not about an adjustable family of policies.

## Family Differences the Expanded Operators Should Expose

The new operator set is designed to separate families through realistic, non-task-breaking pressure:

- neutral wrapper and ancestor lift/sink operators stress direct-child CSS assumptions and depth-sensitive XPath relations
- lookalike sibling/card insertion and duplicate-control operators create ambiguity pressure without deleting the original task target
- text-node split/merge and decorative prefix/suffix operators stress text handling and text-structure assumptions
- label-mechanism rewrites and accessible-name source swaps separate naming outcome from naming mechanism
- pagination, repeated-card, and footer-local operators stress whether a locator family is anchored to direct surface attributes or to relational context
