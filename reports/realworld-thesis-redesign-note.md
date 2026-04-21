# Thesis-Facing Redesign Note

## How CSS and XPath Should Now Be Described

CSS and XPath should now be described as separate locator-engineering families, not as syntax variants over the same selector surface. CSS is evaluated through idiomatic CSS expressions such as concise class or attribute selectors with local scoping. XPath is evaluated through idiomatic XPath expressions such as relational predicates, ancestor or descendant context, and normalized text when text is intentionally part of the strategy.

## How Operator Diversity Should Be Described

Operator diversity is now part of the benchmark policy itself. Within each mutation category, the deterministic sampler first guarantees one selected candidate per applicable operator and then fills the remaining quota by favoring operators with the lowest selected/applicable ratio. This should be described as a fixed methodological rule rather than as a configurable selection preference.

## How Benchmark Limitations Should Now Be Stated

The benchmark still does not claim to represent all web applications, all UI changes, or all practical locator authoring styles. It also still operates within one defined corpus, one mutation framework, and one family boundary (`semantic-first`, `css`, `xpath`). After the redesign, however, a remaining limitation should be phrased more narrowly:

- CSS and XPath can still coincide on some targets when the same surface is genuinely the strongest choice for both
- but widespread CSS/XPath equality should no longer be attributed to routine transliteration by default

## Whether CSS/XPath Equality Still Looks Real

After this redesign, CSS/XPath equality is more interpretable as a real result. The benchmark now measures selector-surface overlap explicitly and reports CSS/XPath discordance over paired mutated runs. If the two families still behave similarly, that similarity is less likely to be a benchmark artifact and more likely to reflect genuinely similar robustness on the audited target set.
