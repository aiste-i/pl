# RealWorld XPath Cleanup Audit

Generated: 2026-04-23T18:29:33.419Z

## Summary

- Suspicious rows reviewed: 27
- Rows kept unchanged: 1
- Rows rewritten: 26
- Rows reverted closer to CSS-aligned surfaces: 8
- Content-heavy rows before cleanup: 27
- Content-heavy rows after cleanup: 1

## Reviewed Rows

| App | Logical Key | Action | Divergence Remains | Divergence Now Relational/Contextual |
| --- | --- | --- | --- | --- |
| angular-realworld-example-app | nav.navbar | rewrite to relational/contextual XPath | yes | yes |
| angular-realworld-example-app | nav.brandLink | revert closer to CSS-aligned surface | yes | yes |
| angular-realworld-example-app | auth.submitButton | rewrite to relational/contextual XPath | yes | yes |
| angular-realworld-example-app | nav.globalFeedTab | rewrite to relational/contextual XPath | yes | yes |
| angular-realworld-example-app | comments.textarea | rewrite to relational/contextual XPath | yes | yes |
| angular-realworld-example-app | comments.submitButton | rewrite to relational/contextual XPath | yes | yes |
| angular-realworld-example-app | settings.bioInput | revert closer to CSS-aligned surface | no | no |
| angular-realworld-example-app | settings.submitButton | rewrite to relational/contextual XPath | no | no |
| angular-realworld-example-app | article.title | revert closer to CSS-aligned surface | yes | yes |
| realworld | nav.navbar | rewrite to relational/contextual XPath | yes | yes |
| realworld | nav.brandLink | revert closer to CSS-aligned surface | yes | yes |
| realworld | auth.submitButton | rewrite to relational/contextual XPath | yes | yes |
| realworld | nav.globalFeedTab | rewrite to relational/contextual XPath | yes | yes |
| realworld | comments.textarea | rewrite to relational/contextual XPath | no | no |
| realworld | comments.submitButton | rewrite to relational/contextual XPath | yes | yes |
| realworld | settings.bioInput | revert closer to CSS-aligned surface | no | no |
| realworld | settings.submitButton | rewrite to relational/contextual XPath | yes | no |
| realworld | article.title | revert closer to CSS-aligned surface | yes | yes |
| vue3-realworld-example-app | nav.navbar | rewrite to relational/contextual XPath | yes | yes |
| vue3-realworld-example-app | nav.brandLink | revert closer to CSS-aligned surface | yes | yes |
| vue3-realworld-example-app | auth.submitButton | rewrite to relational/contextual XPath | yes | yes |
| vue3-realworld-example-app | nav.globalFeedTab | rewrite to relational/contextual XPath | yes | yes |
| vue3-realworld-example-app | comments.textarea | rewrite to relational/contextual XPath | yes | yes |
| vue3-realworld-example-app | comments.submitButton | rewrite to relational/contextual XPath | yes | yes |
| vue3-realworld-example-app | settings.bioInput | keep as-is | no | no |
| vue3-realworld-example-app | settings.submitButton | rewrite to relational/contextual XPath | yes | no |
| vue3-realworld-example-app | article.title | revert closer to CSS-aligned surface | yes | yes |

## angular-realworld-example-app :: nav.navbar

- CSS comparator: `nav.navbar`
- Old XPath: `(//nav[.//a[normalize-space()="conduit"]])[1]`
- Final XPath: `(//nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")][descendant::a[contains(concat(" ", normalize-space(@class), " "), " navbar-brand ")]])[1]`
- Reason flagged: The locator depended on descendant brand text even though the navbar already exposed stable structural and class context.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to use descendant brand-link context inside the navbar shell, keeping the distinction structural rather than copy-driven.
- Expected mutation sensitivity after cleanup: More sensitive to navbar-brand ancestry and descendant reshaping than to brand text edits.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## angular-realworld-example-app :: nav.brandLink

- CSS comparator: `.navbar .navbar-brand`
- Old XPath: `(//nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")]//a[normalize-space()="conduit"])[1]`
- Final XPath: `(//a[contains(concat(" ", normalize-space(@class), " "), " navbar-brand ")][ancestor::nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")]])[1]`
- Reason flagged: Exact brand text was doing most of the work despite a stable navbar-brand class surface.
- Action taken: revert closer to CSS-aligned surface
- Rationale: Moved back toward the stable brand-link class, but kept explicit navbar ancestry so the XPath remains contextual rather than a bare transliteration.
- Expected mutation sensitivity after cleanup: Most sensitive to navbar-brand class changes and navbar ancestry rewrites, not to brand-copy churn.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## angular-realworld-example-app :: auth.submitButton

- CSS comparator: `form button[type="submit"]`
- Old XPath: `(//form//button[normalize-space()="Sign in" or normalize-space()="Sign up"])[1]`
- Final XPath: `(//div[contains(concat(" ", normalize-space(@class), " "), " auth-page ")]//button[@type="submit" and ancestor::form[.//input[@name="email"] and .//input[@name="password"]]])[1]`
- Reason flagged: Button copy had become the primary differentiator even though the auth form has a stable submit contract and stable field context.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to resolve the submit control through the auth form identified by its email/password fields.
- Expected mutation sensitivity after cleanup: Most sensitive to auth-form field-context changes and submit-type rewrites.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## angular-realworld-example-app :: nav.globalFeedTab

- CSS comparator: `.feed-toggle .nav-link[href="/"]`
- Old XPath: `(//div[contains(@class,"feed-toggle")]//a[normalize-space()="Global Feed"])[1]`
- Final XPath: `(//a[@href="/" and ancestor::div[contains(concat(" ", normalize-space(@class), " "), " feed-toggle ")] and ancestor::li[contains(concat(" ", normalize-space(@class), " "), " nav-item ")]])[1]`
- Reason flagged: Visible tab copy was carrying the divergence even though the tab already had stable href and local toggle structure.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to use href plus feed-toggle and nav-item ancestry so the distinction is contextual rather than copy-heavy.
- Expected mutation sensitivity after cleanup: Most sensitive to tab-list restructuring and href rewrites.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## angular-realworld-example-app :: comments.textarea

- CSS comparator: `.comment-form .card-block > textarea.form-control[placeholder="Write a comment..."]`
- Old XPath: `(//form[contains(@class,"comment-form")]//div[contains(@class,"card-block")]//textarea[contains(@placeholder,"Write a comment")])[1]`
- Final XPath: `(//form[contains(concat(" ", normalize-space(@class), " "), " comment-form ")]//div[contains(concat(" ", normalize-space(@class), " "), " card-block ")]/textarea[contains(concat(" ", normalize-space(@class), " "), " form-control ")])[1]`
- Reason flagged: Placeholder text still contributed more than necessary even though the comment form and card-block structure already identify the field.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to stay on comment-form and card-block structure plus the form-control surface, removing placeholder dependence.
- Expected mutation sensitivity after cleanup: Most sensitive to comment-form block reshaping and textarea-control class changes.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## angular-realworld-example-app :: comments.submitButton

- CSS comparator: `.comment-form .card-footer > button.btn.btn-primary[type="submit"]`
- Old XPath: `(//form[contains(@class,"comment-form")]//div[contains(@class,"card-footer")]//button[normalize-space()="Post Comment"])[1]`
- Final XPath: `(//form[contains(concat(" ", normalize-space(@class), " "), " comment-form ")]//div[contains(concat(" ", normalize-space(@class), " "), " card-footer ")]//button[@type="submit" and ancestor::form[.//textarea]])[1]`
- Reason flagged: Exact button copy was the main source of divergence even though footer and form ownership provided a cleaner relational anchor.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to the footer-scoped submit control inside the form that owns the comment textarea.
- Expected mutation sensitivity after cleanup: Most sensitive to footer hierarchy changes, submit-type rewrites, and textarea-context movement.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## angular-realworld-example-app :: settings.bioInput

- CSS comparator: `form textarea.form-control[name="bio"]`
- Old XPath: `(//div[contains(@class,"settings-page")]//textarea[@name="bio" and contains(@placeholder,"Short bio")])[1]`
- Final XPath: `(//div[contains(concat(" ", normalize-space(@class), " "), " settings-page ")]//form//textarea[@name="bio"])[1]`
- Reason flagged: Placeholder copy was being used on top of a stable bio field contract.
- Action taken: revert closer to CSS-aligned surface
- Rationale: Rewritten back toward the stable bio field contract while keeping settings-page form context.
- Expected mutation sensitivity after cleanup: Most sensitive to form-field contract changes and settings-form restructuring.
- Divergence remains: no
- Divergence is now relational/contextual rather than content-driven: no

## angular-realworld-example-app :: settings.submitButton

- CSS comparator: `form .btn.btn-primary.pull-xs-right[type="submit"]`
- Old XPath: `(//div[contains(@class,"settings-page")]//button[normalize-space()="Update Settings"])[1]`
- Final XPath: `(//div[contains(concat(" ", normalize-space(@class), " "), " settings-page ")]//form[.//textarea[@name="bio"]]//button[@type="submit"])[1]`
- Reason flagged: Button copy had become the main difference even though the settings form and bio field provide a stronger relational anchor.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to resolve the submit control through the settings form that owns the bio field.
- Expected mutation sensitivity after cleanup: Most sensitive to settings-form restructuring and submit-type rewrites.
- Divergence remains: no
- Divergence is now relational/contextual rather than content-driven: no

## angular-realworld-example-app :: article.title

- CSS comparator: `.article-page .banner h1`
- Old XPath: `(//div[contains(@class,"article-page")]//div[contains(@class,"banner")]//h1[normalize-space()])[1]`
- Final XPath: `(//div[contains(concat(" ", normalize-space(@class), " "), " article-page ")]//div[contains(concat(" ", normalize-space(@class), " "), " banner ")]/descendant::h1)[1]`
- Reason flagged: The non-empty text predicate did not add real disambiguation and made the title look more content-dependent than necessary.
- Action taken: revert closer to CSS-aligned surface
- Rationale: Rewritten to banner-scoped heading structure so the XPath remains contextual without implying copy sensitivity.
- Expected mutation sensitivity after cleanup: Most sensitive to banner hierarchy and heading-structure changes.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## realworld :: nav.navbar

- CSS comparator: `nav.navbar`
- Old XPath: `(//nav[.//a[normalize-space()="conduit"]])[1]`
- Final XPath: `(//nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")][descendant::a[contains(concat(" ", normalize-space(@class), " "), " navbar-brand ")]])[1]`
- Reason flagged: The locator depended on descendant brand text even though the navbar already exposed stable structural and class context.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to use descendant brand-link context inside the navbar shell, keeping the distinction structural rather than copy-driven.
- Expected mutation sensitivity after cleanup: More sensitive to navbar-brand ancestry and descendant reshaping than to brand text edits.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## realworld :: nav.brandLink

- CSS comparator: `.navbar .navbar-brand`
- Old XPath: `(//nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")]//a[normalize-space()="conduit"])[1]`
- Final XPath: `(//a[contains(concat(" ", normalize-space(@class), " "), " navbar-brand ")][ancestor::nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")]])[1]`
- Reason flagged: Exact brand text was doing most of the work despite a stable navbar-brand class surface.
- Action taken: revert closer to CSS-aligned surface
- Rationale: Moved back toward the stable brand-link class, but kept explicit navbar ancestry so the XPath remains contextual rather than a bare transliteration.
- Expected mutation sensitivity after cleanup: Most sensitive to navbar-brand class changes and navbar ancestry rewrites, not to brand-copy churn.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## realworld :: auth.submitButton

- CSS comparator: `form button[type="submit"]`
- Old XPath: `(//form//button[normalize-space()="Sign in" or normalize-space()="Sign up"])[1]`
- Final XPath: `(//button[@type="submit" and ancestor::form[.//input[@name="email"] and .//input[@name="password"]]])[1]`
- Reason flagged: Button copy had become the primary differentiator even though the auth form has a stable submit contract and stable field context.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to resolve the submit control through the auth form identified by its email/password fields.
- Expected mutation sensitivity after cleanup: Most sensitive to auth-form field-context changes and submit-type rewrites.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## realworld :: nav.globalFeedTab

- CSS comparator: `.feed-toggle .nav-link[href="/?tab=all"]`
- Old XPath: `(//div[contains(@class,"feed-toggle")]//a[normalize-space()="Global Feed"])[1]`
- Final XPath: `(//a[@href="/?tab=all" and ancestor::div[contains(concat(" ", normalize-space(@class), " "), " feed-toggle ")] and ancestor::li[contains(concat(" ", normalize-space(@class), " "), " nav-item ")]])[1]`
- Reason flagged: Visible tab copy was carrying the divergence even though the tab already had stable href and local toggle structure.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to use href plus feed-toggle and nav-item ancestry so the distinction is contextual rather than copy-heavy.
- Expected mutation sensitivity after cleanup: Most sensitive to tab-list restructuring and href rewrites.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## realworld :: comments.textarea

- CSS comparator: `.comment-form .form-control[name="comment"]`
- Old XPath: `(//form[contains(@class,"comment-form")]//textarea[@name="comment" and contains(@placeholder,"Write a comment")])[1]`
- Final XPath: `(//form[contains(concat(" ", normalize-space(@class), " "), " comment-form ")]//div[contains(concat(" ", normalize-space(@class), " "), " card-block ")]//textarea[@name="comment" and contains(concat(" ", normalize-space(@class), " "), " form-control ")])[1]`
- Reason flagged: Placeholder text still contributed more than necessary even though the comment form, card block, and field contract already identify the control.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to the comment-form textarea inside the card block, keeping the stable field contract without leaning on placeholder copy.
- Expected mutation sensitivity after cleanup: Most sensitive to comment-form block reshaping and textarea-control contract changes.
- Divergence remains: no
- Divergence is now relational/contextual rather than content-driven: no

## realworld :: comments.submitButton

- CSS comparator: `.comment-form .card-footer > button.btn.btn-primary[type="submit"]`
- Old XPath: `(//form[contains(@class,"comment-form")]//div[contains(@class,"card-footer")]//button[normalize-space()="Post Comment"])[1]`
- Final XPath: `(//form[contains(concat(" ", normalize-space(@class), " "), " comment-form ")]//div[contains(concat(" ", normalize-space(@class), " "), " card-footer ")]//button[@type="submit" and ancestor::form[.//textarea[@name="comment"]]])[1]`
- Reason flagged: Exact button copy was the main source of divergence even though footer and form ownership provided a cleaner relational anchor.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to the footer-scoped submit control inside the form that owns the comment textarea.
- Expected mutation sensitivity after cleanup: Most sensitive to footer hierarchy changes, submit-type rewrites, and textarea-context movement.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## realworld :: settings.bioInput

- CSS comparator: `.settings-page textarea.form-control[name="bio"]`
- Old XPath: `(//div[contains(@class,"settings-page")]//textarea[@name="bio" and contains(@placeholder,"Short bio")])[1]`
- Final XPath: `(//div[contains(concat(" ", normalize-space(@class), " "), " settings-page ")]//form//textarea[@name="bio"])[1]`
- Reason flagged: Placeholder copy was being used on top of a stable bio field contract.
- Action taken: revert closer to CSS-aligned surface
- Rationale: Rewritten back toward the stable bio field contract while keeping settings-page form context.
- Expected mutation sensitivity after cleanup: Most sensitive to form-field contract changes and settings-form restructuring.
- Divergence remains: no
- Divergence is now relational/contextual rather than content-driven: no

## realworld :: settings.submitButton

- CSS comparator: `form .btn.btn-primary.pull-xs-right`
- Old XPath: `(//div[contains(@class,"settings-page")]//button[normalize-space()="Update Settings"])[1]`
- Final XPath: `(//div[contains(concat(" ", normalize-space(@class), " "), " settings-page ")]//form[.//textarea[@name="bio"]]//button[contains(concat(" ", normalize-space(@class), " "), " btn-primary ")])[1]`
- Reason flagged: Button copy had become the main difference even though the settings form and bio field provide a stronger relational anchor.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to resolve the submit control through the settings form that owns the bio field.
- Expected mutation sensitivity after cleanup: Most sensitive to settings-form restructuring and primary-button contract changes.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: no

## realworld :: article.title

- CSS comparator: `.article-page .banner h1`
- Old XPath: `(//div[contains(@class,"article-page")]//div[contains(@class,"banner")]//h1[normalize-space()])[1]`
- Final XPath: `(//div[contains(concat(" ", normalize-space(@class), " "), " article-page ")]//div[contains(concat(" ", normalize-space(@class), " "), " banner ")]/descendant::h1)[1]`
- Reason flagged: The non-empty text predicate did not add real disambiguation and made the title look more content-dependent than necessary.
- Action taken: revert closer to CSS-aligned surface
- Rationale: Rewritten to banner-scoped heading structure so the XPath remains contextual without implying copy sensitivity.
- Expected mutation sensitivity after cleanup: Most sensitive to banner hierarchy and heading-structure changes.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## vue3-realworld-example-app :: nav.navbar

- CSS comparator: `nav.navbar`
- Old XPath: `(//nav[.//a[normalize-space()="conduit"]])[1]`
- Final XPath: `(//nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")][descendant::a[contains(concat(" ", normalize-space(@class), " "), " navbar-brand ")]])[1]`
- Reason flagged: The locator depended on descendant brand text even though the navbar already exposed stable structural and class context.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to use descendant brand-link context inside the navbar shell, keeping the distinction structural rather than copy-driven.
- Expected mutation sensitivity after cleanup: More sensitive to navbar-brand ancestry and descendant reshaping than to brand text edits.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## vue3-realworld-example-app :: nav.brandLink

- CSS comparator: `.navbar .navbar-brand`
- Old XPath: `(//nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")]//a[normalize-space()="conduit"])[1]`
- Final XPath: `(//a[contains(concat(" ", normalize-space(@class), " "), " navbar-brand ")][ancestor::nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")]])[1]`
- Reason flagged: Exact brand text was doing most of the work despite a stable navbar-brand class surface.
- Action taken: revert closer to CSS-aligned surface
- Rationale: Moved back toward the stable brand-link class, but kept explicit navbar ancestry so the XPath remains contextual rather than a bare transliteration.
- Expected mutation sensitivity after cleanup: Most sensitive to navbar-brand class changes and navbar ancestry rewrites, not to brand-copy churn.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## vue3-realworld-example-app :: auth.submitButton

- CSS comparator: `form button[type="submit"]`
- Old XPath: `(//form//button[normalize-space()="Sign in" or normalize-space()="Sign up"])[1]`
- Final XPath: `(//button[@type="submit" and ancestor::form[.//input[@type="email"] and .//input[@type="password"]]])[1]`
- Reason flagged: Button copy had become the primary differentiator even though the auth form has a stable submit contract and stable field context.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to resolve the submit control through the auth form identified by its email/password fields.
- Expected mutation sensitivity after cleanup: Most sensitive to auth-form field-context changes and submit-type rewrites.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## vue3-realworld-example-app :: nav.globalFeedTab

- CSS comparator: `.articles-toggle .nav-link[href="#/"]`
- Old XPath: `(//div[contains(@class,"articles-toggle")]//a[normalize-space()="Global Feed"])[1]`
- Final XPath: `(//a[@href="#/" and ancestor::div[contains(concat(" ", normalize-space(@class), " "), " articles-toggle ")] and ancestor::li[contains(concat(" ", normalize-space(@class), " "), " nav-item ")]])[1]`
- Reason flagged: Visible tab copy was carrying the divergence even though the tab already had stable href and local toggle structure.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to use href plus articles-toggle and nav-item ancestry so the distinction is contextual rather than copy-heavy.
- Expected mutation sensitivity after cleanup: Most sensitive to tab-list restructuring and href rewrites.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## vue3-realworld-example-app :: comments.textarea

- CSS comparator: `.comment-form .form-control[placeholder="Write a comment..."]`
- Old XPath: `(//form[contains(@class,"comment-form")]//textarea[contains(@placeholder,"Write a comment")])[1]`
- Final XPath: `(//form[contains(concat(" ", normalize-space(@class), " "), " comment-form ")]//div[contains(concat(" ", normalize-space(@class), " "), " card-block ")]//textarea[contains(concat(" ", normalize-space(@class), " "), " form-control ")])[1]`
- Reason flagged: Placeholder text still contributed more than necessary even though the comment form and card-block structure already identify the field.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to stay on comment-form and card-block structure plus the form-control surface, removing placeholder dependence.
- Expected mutation sensitivity after cleanup: Most sensitive to comment-form block reshaping and textarea-control class changes.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## vue3-realworld-example-app :: comments.submitButton

- CSS comparator: `.comment-form .card-footer > button[type="submit"]`
- Old XPath: `(//form[contains(@class,"comment-form")]//div[contains(@class,"card-footer")]//button[@aria-label="Submit"])[1]`
- Final XPath: `(//form[contains(concat(" ", normalize-space(@class), " "), " comment-form ")]//div[contains(concat(" ", normalize-space(@class), " "), " card-footer ")]//button[@type="submit" and ancestor::form[.//textarea]])[1]`
- Reason flagged: The locator had shifted onto an accessibility label even though the submit contract and footer/form relation already identified the control.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to the footer-scoped submit control inside the form that owns the comment textarea.
- Expected mutation sensitivity after cleanup: Most sensitive to footer hierarchy changes, submit-type rewrites, and textarea-context movement.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes

## vue3-realworld-example-app :: settings.bioInput

- CSS comparator: `form textarea[aria-label="Bio"]`
- Old XPath: `(//div[contains(@class,"settings-page")]//textarea[@aria-label="Bio"])[1]`
- Final XPath: `(//div[contains(@class,"settings-page")]//textarea[@aria-label="Bio"])[1]`
- Reason flagged: Reviewed because the field contract is accessibility-driven and could be mistaken for forced divergence.
- Action taken: keep as-is
- Rationale: Kept unchanged because this app genuinely exposes the bio field through a stable aria-label contract, and no stronger non-content anchor is available without collapsing to a vague bare textarea.
- Expected mutation sensitivity after cleanup: Most sensitive to labeling-mechanism rewrites on the bio field and settings-form context changes.
- Divergence remains: no
- Divergence is now relational/contextual rather than content-driven: no

## vue3-realworld-example-app :: settings.submitButton

- CSS comparator: `form button[type="submit"]`
- Old XPath: `(//div[contains(@class,"settings-page")]//button[normalize-space()="Update Settings"])[1]`
- Final XPath: `(//div[contains(concat(" ", normalize-space(@class), " "), " settings-page ")]//form[.//textarea[@aria-label="Bio"]]//button[@type="submit"])[1]`
- Reason flagged: Button copy had become the main difference even though the settings form and bio field provide a stronger relational anchor.
- Action taken: rewrite to relational/contextual XPath
- Rationale: Rewritten to resolve the submit control through the settings form that owns the bio field.
- Expected mutation sensitivity after cleanup: Most sensitive to settings-form restructuring and submit-type rewrites.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: no

## vue3-realworld-example-app :: article.title

- CSS comparator: `.article-page .banner h1`
- Old XPath: `(//div[contains(@class,"article-page")]//div[contains(@class,"banner")]//h1[normalize-space()])[1]`
- Final XPath: `(//div[contains(concat(" ", normalize-space(@class), " "), " article-page ")]//div[contains(concat(" ", normalize-space(@class), " "), " banner ")]/descendant::h1)[1]`
- Reason flagged: The non-empty text predicate did not add real disambiguation and made the title look more content-dependent than necessary.
- Action taken: revert closer to CSS-aligned surface
- Rationale: Rewritten to banner-scoped heading structure so the XPath remains contextual without implying copy sensitivity.
- Expected mutation sensitivity after cleanup: Most sensitive to banner hierarchy and heading-structure changes.
- Divergence remains: yes
- Divergence is now relational/contextual rather than content-driven: yes
