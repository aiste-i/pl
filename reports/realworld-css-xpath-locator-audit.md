# RealWorld CSS/XPath Locator Audit

Generated: 2026-04-22T19:03:09.266Z

## Overlap Audit

- Current matched-surface rows: 45/57 (0.7895)
- Current family-distinct rows: 12/57 (0.2105)
- Refactored matched-surface rows: 25/57 (0.4386)
- Refactored family-distinct rows: 32/57 (0.5614)

## angular-realworld-example-app

| Logical Key | Current CSS Surface | Current XPath Surface | Current Pair | Refactored CSS Surface | Refactored XPath Surface | Refactored Pair |
| --- | --- | --- | --- | --- | --- | --- |
| nav.brandLink | class-token | class-context | matched-surface | class-token | axis-relational | family-distinct |
| nav.navbar | class-token | class-context | matched-surface | class-token | axis-relational | family-distinct |
| auth.emailInput | attribute-selector | attribute-predicate | matched-surface | attribute-selector | attribute-predicate | matched-surface |
| auth.passwordInput | attribute-selector | attribute-predicate | matched-surface | attribute-selector | attribute-predicate | matched-surface |
| auth.submitButton | attribute-selector | attribute-predicate | matched-surface | attribute-selector | axis-relational | family-distinct |
| nav.globalFeedTab | attribute-selector | attribute-predicate | matched-surface | attribute-selector | axis-relational | family-distinct |
| home.firstReadMoreLink | scoped-structure | class-context | family-distinct | scoped-structure | class-context | family-distinct |
| comments.textarea | attribute-selector | accessibility-attribute-predicate | family-distinct | scoped-attribute-structure | relational-structure | family-distinct |
| comments.submitButton | attribute-selector | attribute-predicate | matched-surface | scoped-attribute-structure | axis-relational | family-distinct |
| settings.bioInput | attribute-selector | attribute-predicate | matched-surface | attribute-selector | attribute-predicate | matched-surface |
| settings.submitButton | attribute-selector | attribute-predicate | matched-surface | attribute-selector | attribute-predicate | matched-surface |
| article.favoriteButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| home.previewDescription | scoped-structure | class-context | family-distinct | scoped-attribute-structure | accessibility-attribute-predicate | family-distinct |
| comments.deleteButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| article.title | class-token | class-context | matched-surface | class-token | axis-relational | family-distinct |
| home.paginationButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| home.paginationItem | class-token | accessibility-attribute-predicate | family-distinct | parent-relational | accessibility-attribute-predicate | family-distinct |
| profile.followButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| profile.unfollowButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |

## realworld

| Logical Key | Current CSS Surface | Current XPath Surface | Current Pair | Refactored CSS Surface | Refactored XPath Surface | Refactored Pair |
| --- | --- | --- | --- | --- | --- | --- |
| nav.brandLink | class-token | class-context | matched-surface | class-token | axis-relational | family-distinct |
| nav.navbar | class-token | class-context | matched-surface | class-token | axis-relational | family-distinct |
| auth.emailInput | attribute-selector | attribute-predicate | matched-surface | attribute-selector | attribute-predicate | matched-surface |
| auth.passwordInput | attribute-selector | attribute-predicate | matched-surface | attribute-selector | attribute-predicate | matched-surface |
| auth.submitButton | attribute-selector | attribute-predicate | matched-surface | attribute-selector | axis-relational | family-distinct |
| nav.globalFeedTab | attribute-selector | attribute-predicate | matched-surface | attribute-selector | axis-relational | family-distinct |
| home.firstReadMoreLink | class-token | class-context | matched-surface | attribute-selector | axis-relational | family-distinct |
| comments.textarea | attribute-selector | attribute-predicate | matched-surface | attribute-selector | attribute-predicate | matched-surface |
| comments.submitButton | attribute-selector | attribute-predicate | matched-surface | scoped-attribute-structure | axis-relational | family-distinct |
| settings.bioInput | attribute-selector | attribute-predicate | matched-surface | attribute-selector | attribute-predicate | matched-surface |
| settings.submitButton | class-token | class-context | matched-surface | class-token | attribute-predicate | family-distinct |
| article.favoriteButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| home.previewDescription | scoped-structure | class-context | family-distinct | scoped-attribute-structure | accessibility-attribute-predicate | family-distinct |
| comments.deleteButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| article.title | class-token | class-context | matched-surface | class-token | axis-relational | family-distinct |
| home.paginationButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| home.paginationItem | class-token | accessibility-attribute-predicate | family-distinct | parent-relational | accessibility-attribute-predicate | family-distinct |
| profile.followButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| profile.unfollowButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |

## vue3-realworld-example-app

| Logical Key | Current CSS Surface | Current XPath Surface | Current Pair | Refactored CSS Surface | Refactored XPath Surface | Refactored Pair |
| --- | --- | --- | --- | --- | --- | --- |
| nav.brandLink | class-token | class-context | matched-surface | class-token | axis-relational | family-distinct |
| nav.navbar | class-token | class-context | matched-surface | class-token | axis-relational | family-distinct |
| auth.emailInput | attribute-selector | accessibility-attribute-predicate | family-distinct | attribute-selector | attribute-predicate | matched-surface |
| auth.passwordInput | attribute-selector | accessibility-attribute-predicate | family-distinct | attribute-selector | attribute-predicate | matched-surface |
| auth.submitButton | attribute-selector | attribute-predicate | matched-surface | attribute-selector | axis-relational | family-distinct |
| nav.globalFeedTab | attribute-selector | attribute-predicate | matched-surface | attribute-selector | axis-relational | family-distinct |
| home.firstReadMoreLink | attribute-selector | attribute-predicate | matched-surface | attribute-selector | axis-relational | family-distinct |
| comments.textarea | attribute-selector | accessibility-attribute-predicate | family-distinct | attribute-selector | relational-structure | family-distinct |
| comments.submitButton | attribute-selector | attribute-predicate | matched-surface | scoped-attribute-structure | axis-relational | family-distinct |
| settings.bioInput | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| settings.submitButton | attribute-selector | attribute-predicate | matched-surface | attribute-selector | accessibility-attribute-predicate | family-distinct |
| article.favoriteButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| home.previewDescription | scoped-structure | class-context | family-distinct | scoped-attribute-structure | accessibility-attribute-predicate | family-distinct |
| comments.deleteButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| article.title | class-token | class-context | matched-surface | class-token | axis-relational | family-distinct |
| home.paginationButton | class-token | accessibility-attribute-predicate | family-distinct | scoped-structure | accessibility-attribute-predicate | family-distinct |
| home.paginationItem | class-token | accessibility-attribute-predicate | family-distinct | parent-relational | accessibility-attribute-predicate | family-distinct |
| profile.followButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
| profile.unfollowButton | accessibility-attribute | accessibility-attribute-predicate | matched-surface | accessibility-attribute | accessibility-attribute-predicate | matched-surface |
