# Thesis Note: Supplementary RealWorld Semantic Sub-Corpus

The primary RealWorld corpus remains unchanged and continues to define the main thesis benchmark denominator.

The supplementary `realworld-semantic-supplement` corpus was added because the audited primary corpus naturally overrepresented `getByRole()` within the semantic-first family. The supplement broadens empirical coverage of Playwright built-in user-facing locators without rebalancing or redefining the primary dataset.

The supplement is small, explicit, and methodologically isolated. It exercises `getByLabel()`, `getByText()`, `getByPlaceholder()`, and `getByAltText()` only where those contracts are naturally present in the RealWorld applications. `getByTitle()` is omitted because no stable, natural title-driven target was found.

Suggested thesis wording:

> The primary corpus reflects realistic dominant semantic usage in the audited RealWorld applications, while a small supplementary semantic-coverage corpus was added to observe additional built-in locator strategies that were underrepresented in the main dataset.
