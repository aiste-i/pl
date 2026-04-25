import fs from 'fs';
import path from 'path';
import { REALWORLD_APP_IDS } from '../../apps';
import type { SupportedAppId } from '../../apps/types';
import type { RealWorldLogicalKey } from './keys';
import { generateCssXpathAuditReport } from './css-xpath-audit';

type CleanupAction =
  | 'keep-as-is'
  | 'rewrite-to-relational-contextual-xpath'
  | 'revert-closer-to-css-aligned-surface';

interface CleanupSnapshot {
  oldXPath: string;
  reasonFlagged: string;
  actionTaken: CleanupAction;
  rationale: string;
  expectedMutationSensitivity: string;
  contentHeavyAfterCleanup: boolean;
  justifiedContentHeavyAfterCleanup?: boolean;
}

export interface XPathCleanupAuditRow {
  appId: SupportedAppId;
  logicalKey: RealWorldLogicalKey;
  cssComparator: string;
  oldXPath: string;
  finalXPath: string;
  finalXpathPrimarySurface: string;
  finalPairRelationship: 'matched-surface' | 'family-distinct';
  reasonFlagged: string;
  actionTaken: CleanupAction;
  rationale: string;
  expectedMutationSensitivity: string;
  divergenceRemains: boolean;
  divergenceIsRelationalContextual: boolean;
}

export interface XPathCleanupAuditReport {
  generatedAt: string;
  summary: {
    reviewedRows: number;
    keptUnchanged: number;
    rewritten: number;
    revertedCloserToCssAlignedSurfaces: number;
    previousContentHeavyRows: number;
    currentContentHeavyRows: number;
    remainingJustifiedContentHeavyRows: string[];
  };
  rows: XPathCleanupAuditRow[];
}

type RealWorldSupportedAppId = (typeof REALWORLD_APP_IDS)[number];

const REVIEWED_ROWS: Partial<Record<SupportedAppId, Partial<Record<RealWorldLogicalKey, CleanupSnapshot>>>> = {
  'angular-realworld-example-app': {
    'nav.navbar': {
      oldXPath: '(//nav[.//a[normalize-space()="conduit"]])[1]',
      reasonFlagged: 'The locator depended on descendant brand text even though the navbar already exposed stable structural and class context.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to use descendant brand-link context inside the navbar shell, keeping the distinction structural rather than copy-driven.',
      expectedMutationSensitivity: 'More sensitive to navbar-brand ancestry and descendant reshaping than to brand text edits.',
      contentHeavyAfterCleanup: false,
    },
    'nav.brandLink': {
      oldXPath: '(//nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")]//a[normalize-space()="conduit"])[1]',
      reasonFlagged: 'Exact brand text was doing most of the work despite a stable navbar-brand class surface.',
      actionTaken: 'revert-closer-to-css-aligned-surface',
      rationale: 'Moved back toward the stable brand-link class, but kept explicit navbar ancestry so the XPath remains contextual rather than a bare transliteration.',
      expectedMutationSensitivity: 'Most sensitive to navbar-brand class changes and navbar ancestry rewrites, not to brand-copy churn.',
      contentHeavyAfterCleanup: false,
    },
    'auth.submitButton': {
      oldXPath: '(//form//button[normalize-space()="Sign in" or normalize-space()="Sign up"])[1]',
      reasonFlagged: 'Button copy had become the primary differentiator even though the auth form has a stable submit contract and stable field context.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to resolve the submit control through the auth form identified by its email/password fields.',
      expectedMutationSensitivity: 'Most sensitive to auth-form field-context changes and submit-type rewrites.',
      contentHeavyAfterCleanup: false,
    },
    'nav.globalFeedTab': {
      oldXPath: '(//div[contains(@class,"feed-toggle")]//a[normalize-space()="Global Feed"])[1]',
      reasonFlagged: 'Visible tab copy was carrying the divergence even though the tab already had stable href and local toggle structure.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to use href plus feed-toggle and nav-item ancestry so the distinction is contextual rather than copy-heavy.',
      expectedMutationSensitivity: 'Most sensitive to tab-list restructuring and href rewrites.',
      contentHeavyAfterCleanup: false,
    },
    'comments.textarea': {
      oldXPath:
        '(//form[contains(@class,"comment-form")]//div[contains(@class,"card-block")]//textarea[contains(@placeholder,"Write a comment")])[1]',
      reasonFlagged: 'Placeholder text still contributed more than necessary even though the comment form and card-block structure already identify the field.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to stay on comment-form and card-block structure plus the form-control surface, removing placeholder dependence.',
      expectedMutationSensitivity: 'Most sensitive to comment-form block reshaping and textarea-control class changes.',
      contentHeavyAfterCleanup: false,
    },
    'comments.submitButton': {
      oldXPath: '(//form[contains(@class,"comment-form")]//div[contains(@class,"card-footer")]//button[normalize-space()="Post Comment"])[1]',
      reasonFlagged: 'Exact button copy was the main source of divergence even though footer and form ownership provided a cleaner relational anchor.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to the footer-scoped submit control inside the form that owns the comment textarea.',
      expectedMutationSensitivity: 'Most sensitive to footer hierarchy changes, submit-type rewrites, and textarea-context movement.',
      contentHeavyAfterCleanup: false,
    },
    'settings.bioInput': {
      oldXPath: '(//div[contains(@class,"settings-page")]//textarea[@name="bio" and contains(@placeholder,"Short bio")])[1]',
      reasonFlagged: 'Placeholder copy was being used on top of a stable bio field contract.',
      actionTaken: 'revert-closer-to-css-aligned-surface',
      rationale: 'Rewritten back toward the stable bio field contract while keeping settings-page form context.',
      expectedMutationSensitivity: 'Most sensitive to form-field contract changes and settings-form restructuring.',
      contentHeavyAfterCleanup: false,
    },
    'settings.submitButton': {
      oldXPath: '(//div[contains(@class,"settings-page")]//button[normalize-space()="Update Settings"])[1]',
      reasonFlagged: 'Button copy had become the main difference even though the settings form and bio field provide a stronger relational anchor.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to resolve the submit control through the settings form that owns the bio field.',
      expectedMutationSensitivity: 'Most sensitive to settings-form restructuring and submit-type rewrites.',
      contentHeavyAfterCleanup: false,
    },
    'article.title': {
      oldXPath: '(//div[contains(@class,"article-page")]//div[contains(@class,"banner")]//h1[normalize-space()])[1]',
      reasonFlagged: 'The non-empty text predicate did not add real disambiguation and made the title look more content-dependent than necessary.',
      actionTaken: 'revert-closer-to-css-aligned-surface',
      rationale: 'Rewritten to banner-scoped heading structure so the XPath remains contextual without implying copy sensitivity.',
      expectedMutationSensitivity: 'Most sensitive to banner hierarchy and heading-structure changes.',
      contentHeavyAfterCleanup: false,
    },
  },
  realworld: {
    'nav.navbar': {
      oldXPath: '(//nav[.//a[normalize-space()="conduit"]])[1]',
      reasonFlagged: 'The locator depended on descendant brand text even though the navbar already exposed stable structural and class context.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to use descendant brand-link context inside the navbar shell, keeping the distinction structural rather than copy-driven.',
      expectedMutationSensitivity: 'More sensitive to navbar-brand ancestry and descendant reshaping than to brand text edits.',
      contentHeavyAfterCleanup: false,
    },
    'nav.brandLink': {
      oldXPath: '(//nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")]//a[normalize-space()="conduit"])[1]',
      reasonFlagged: 'Exact brand text was doing most of the work despite a stable navbar-brand class surface.',
      actionTaken: 'revert-closer-to-css-aligned-surface',
      rationale: 'Moved back toward the stable brand-link class, but kept explicit navbar ancestry so the XPath remains contextual rather than a bare transliteration.',
      expectedMutationSensitivity: 'Most sensitive to navbar-brand class changes and navbar ancestry rewrites, not to brand-copy churn.',
      contentHeavyAfterCleanup: false,
    },
    'auth.submitButton': {
      oldXPath: '(//form//button[normalize-space()="Sign in" or normalize-space()="Sign up"])[1]',
      reasonFlagged: 'Button copy had become the primary differentiator even though the auth form has a stable submit contract and stable field context.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to resolve the submit control through the auth form identified by its email/password fields.',
      expectedMutationSensitivity: 'Most sensitive to auth-form field-context changes and submit-type rewrites.',
      contentHeavyAfterCleanup: false,
    },
    'nav.globalFeedTab': {
      oldXPath: '(//div[contains(@class,"feed-toggle")]//a[normalize-space()="Global Feed"])[1]',
      reasonFlagged: 'Visible tab copy was carrying the divergence even though the tab already had stable href and local toggle structure.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to use href plus feed-toggle and nav-item ancestry so the distinction is contextual rather than copy-heavy.',
      expectedMutationSensitivity: 'Most sensitive to tab-list restructuring and href rewrites.',
      contentHeavyAfterCleanup: false,
    },
    'comments.textarea': {
      oldXPath:
        '(//form[contains(@class,"comment-form")]//textarea[@name="comment" and contains(@placeholder,"Write a comment")])[1]',
      reasonFlagged: 'Placeholder text still contributed more than necessary even though the comment form, card block, and field contract already identify the control.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to the comment-form textarea inside the card block, keeping the stable field contract without leaning on placeholder copy.',
      expectedMutationSensitivity: 'Most sensitive to comment-form block reshaping and textarea-control contract changes.',
      contentHeavyAfterCleanup: false,
    },
    'comments.submitButton': {
      oldXPath: '(//form[contains(@class,"comment-form")]//div[contains(@class,"card-footer")]//button[normalize-space()="Post Comment"])[1]',
      reasonFlagged: 'Exact button copy was the main source of divergence even though footer and form ownership provided a cleaner relational anchor.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to the footer-scoped submit control inside the form that owns the comment textarea.',
      expectedMutationSensitivity: 'Most sensitive to footer hierarchy changes, submit-type rewrites, and textarea-context movement.',
      contentHeavyAfterCleanup: false,
    },
    'settings.bioInput': {
      oldXPath: '(//div[contains(@class,"settings-page")]//textarea[@name="bio" and contains(@placeholder,"Short bio")])[1]',
      reasonFlagged: 'Placeholder copy was being used on top of a stable bio field contract.',
      actionTaken: 'revert-closer-to-css-aligned-surface',
      rationale: 'Rewritten back toward the stable bio field contract while keeping settings-page form context.',
      expectedMutationSensitivity: 'Most sensitive to form-field contract changes and settings-form restructuring.',
      contentHeavyAfterCleanup: false,
    },
    'settings.submitButton': {
      oldXPath: '(//div[contains(@class,"settings-page")]//button[normalize-space()="Update Settings"])[1]',
      reasonFlagged: 'Button copy had become the main difference even though the settings form and bio field provide a stronger relational anchor.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to resolve the submit control through the settings form that owns the bio field.',
      expectedMutationSensitivity: 'Most sensitive to settings-form restructuring and primary-button contract changes.',
      contentHeavyAfterCleanup: false,
    },
    'article.title': {
      oldXPath: '(//div[contains(@class,"article-page")]//div[contains(@class,"banner")]//h1[normalize-space()])[1]',
      reasonFlagged: 'The non-empty text predicate did not add real disambiguation and made the title look more content-dependent than necessary.',
      actionTaken: 'revert-closer-to-css-aligned-surface',
      rationale: 'Rewritten to banner-scoped heading structure so the XPath remains contextual without implying copy sensitivity.',
      expectedMutationSensitivity: 'Most sensitive to banner hierarchy and heading-structure changes.',
      contentHeavyAfterCleanup: false,
    },
  },
  'vue3-realworld-example-app': {
    'nav.navbar': {
      oldXPath: '(//nav[.//a[normalize-space()="conduit"]])[1]',
      reasonFlagged: 'The locator depended on descendant brand text even though the navbar already exposed stable structural and class context.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to use descendant brand-link context inside the navbar shell, keeping the distinction structural rather than copy-driven.',
      expectedMutationSensitivity: 'More sensitive to navbar-brand ancestry and descendant reshaping than to brand text edits.',
      contentHeavyAfterCleanup: false,
    },
    'nav.brandLink': {
      oldXPath: '(//nav[contains(concat(" ", normalize-space(@class), " "), " navbar ")]//a[normalize-space()="conduit"])[1]',
      reasonFlagged: 'Exact brand text was doing most of the work despite a stable navbar-brand class surface.',
      actionTaken: 'revert-closer-to-css-aligned-surface',
      rationale: 'Moved back toward the stable brand-link class, but kept explicit navbar ancestry so the XPath remains contextual rather than a bare transliteration.',
      expectedMutationSensitivity: 'Most sensitive to navbar-brand class changes and navbar ancestry rewrites, not to brand-copy churn.',
      contentHeavyAfterCleanup: false,
    },
    'auth.submitButton': {
      oldXPath: '(//form//button[normalize-space()="Sign in" or normalize-space()="Sign up"])[1]',
      reasonFlagged: 'Button copy had become the primary differentiator even though the auth form has a stable submit contract and stable field context.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to resolve the submit control through the auth form identified by its email/password fields.',
      expectedMutationSensitivity: 'Most sensitive to auth-form field-context changes and submit-type rewrites.',
      contentHeavyAfterCleanup: false,
    },
    'nav.globalFeedTab': {
      oldXPath: '(//div[contains(@class,"articles-toggle")]//a[normalize-space()="Global Feed"])[1]',
      reasonFlagged: 'Visible tab copy was carrying the divergence even though the tab already had stable href and local toggle structure.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to use href plus articles-toggle and nav-item ancestry so the distinction is contextual rather than copy-heavy.',
      expectedMutationSensitivity: 'Most sensitive to tab-list restructuring and href rewrites.',
      contentHeavyAfterCleanup: false,
    },
    'comments.textarea': {
      oldXPath: '(//form[contains(@class,"comment-form")]//textarea[contains(@placeholder,"Write a comment")])[1]',
      reasonFlagged: 'Placeholder text still contributed more than necessary even though the comment form and card-block structure already identify the field.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to stay on comment-form and card-block structure plus the form-control surface, removing placeholder dependence.',
      expectedMutationSensitivity: 'Most sensitive to comment-form block reshaping and textarea-control class changes.',
      contentHeavyAfterCleanup: false,
    },
    'comments.submitButton': {
      oldXPath: '(//form[contains(@class,"comment-form")]//div[contains(@class,"card-footer")]//button[@aria-label="Submit"])[1]',
      reasonFlagged: 'The locator had shifted onto an accessibility label even though the submit contract and footer/form relation already identified the control.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to the footer-scoped submit control inside the form that owns the comment textarea.',
      expectedMutationSensitivity: 'Most sensitive to footer hierarchy changes, submit-type rewrites, and textarea-context movement.',
      contentHeavyAfterCleanup: false,
    },
    'settings.bioInput': {
      oldXPath: '(//div[contains(@class,"settings-page")]//textarea[@aria-label="Bio"])[1]',
      reasonFlagged: 'Reviewed because the field contract is accessibility-driven and could be mistaken for forced divergence.',
      actionTaken: 'keep-as-is',
      rationale: 'Kept unchanged because this app genuinely exposes the bio field through a stable aria-label contract, and no stronger non-content anchor is available without collapsing to a vague bare textarea.',
      expectedMutationSensitivity: 'Most sensitive to labeling-mechanism rewrites on the bio field and settings-form context changes.',
      contentHeavyAfterCleanup: true,
      justifiedContentHeavyAfterCleanup: true,
    },
    'settings.submitButton': {
      oldXPath: '(//div[contains(@class,"settings-page")]//button[normalize-space()="Update Settings"])[1]',
      reasonFlagged: 'Button copy had become the main difference even though the settings form and bio field provide a stronger relational anchor.',
      actionTaken: 'rewrite-to-relational-contextual-xpath',
      rationale: 'Rewritten to resolve the submit control through the settings form that owns the bio field.',
      expectedMutationSensitivity: 'Most sensitive to settings-form restructuring and submit-type rewrites.',
      contentHeavyAfterCleanup: false,
    },
    'article.title': {
      oldXPath: '(//div[contains(@class,"article-page")]//div[contains(@class,"banner")]//h1[normalize-space()])[1]',
      reasonFlagged: 'The non-empty text predicate did not add real disambiguation and made the title look more content-dependent than necessary.',
      actionTaken: 'revert-closer-to-css-aligned-surface',
      rationale: 'Rewritten to banner-scoped heading structure so the XPath remains contextual without implying copy sensitivity.',
      expectedMutationSensitivity: 'Most sensitive to banner hierarchy and heading-structure changes.',
      contentHeavyAfterCleanup: false,
    },
  },
};

export function generateXPathCleanupAuditReport(): XPathCleanupAuditReport {
  const cssXpathAudit = generateCssXpathAuditReport();
  const currentRows = new Map(
    cssXpathAudit.rows.map(row => [`${row.appId}::${row.logicalKey}`, row] as const),
  );

  const rows: XPathCleanupAuditRow[] = [];

  for (const [appId, reviewRows] of Object.entries(REVIEWED_ROWS) as Array<
    [RealWorldSupportedAppId, Partial<Record<RealWorldLogicalKey, CleanupSnapshot>>]
  >) {
    for (const [logicalKey, review] of Object.entries(reviewRows) as Array<[RealWorldLogicalKey, CleanupSnapshot]>) {
      const auditRow = currentRows.get(`${appId}::${logicalKey}`);
      if (!auditRow) {
        throw new Error(`Missing CSS/XPath audit row for ${appId} ${logicalKey}`);
      }

      rows.push({
        appId,
        logicalKey,
        cssComparator: auditRow.refactoredCssLocator,
        oldXPath: review.oldXPath,
        finalXPath: auditRow.refactoredXpathLocator,
        finalXpathPrimarySurface: auditRow.refactoredXpathPrimarySurface,
        finalPairRelationship: auditRow.refactoredPairRelationship,
        reasonFlagged: review.reasonFlagged,
        actionTaken: review.actionTaken,
        rationale: review.rationale,
        expectedMutationSensitivity: review.expectedMutationSensitivity,
        divergenceRemains: auditRow.refactoredPairRelationship === 'family-distinct',
        divergenceIsRelationalContextual:
          auditRow.refactoredPairRelationship === 'family-distinct'
          && ['axis-relational', 'relational-structure'].includes(auditRow.refactoredXpathPrimarySurface),
      });
    }
  }

  const keptUnchanged = rows.filter(row => row.actionTaken === 'keep-as-is').length;
  const revertedCloserToCssAlignedSurfaces = rows.filter(
    row => row.actionTaken === 'revert-closer-to-css-aligned-surface',
  ).length;
  const remainingJustifiedContentHeavyRows = rows
    .filter(row => REVIEWED_ROWS[row.appId]?.[row.logicalKey]?.justifiedContentHeavyAfterCleanup)
    .map(row => `${row.appId} :: ${row.logicalKey}`);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      reviewedRows: rows.length,
      keptUnchanged,
      rewritten: rows.length - keptUnchanged,
      revertedCloserToCssAlignedSurfaces,
      previousContentHeavyRows: rows.length,
      currentContentHeavyRows: remainingJustifiedContentHeavyRows.length,
      remainingJustifiedContentHeavyRows,
    },
    rows,
  };
}

function renderAction(action: CleanupAction): string {
  if (action === 'keep-as-is') {
    return 'keep as-is';
  }
  if (action === 'revert-closer-to-css-aligned-surface') {
    return 'revert closer to CSS-aligned surface';
  }
  return 'rewrite to relational/contextual XPath';
}

export function renderXPathCleanupAuditMarkdown(report: XPathCleanupAuditReport): string {
  const lines: string[] = [
    '# RealWorld XPath Cleanup Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Suspicious rows reviewed: ${report.summary.reviewedRows}`,
    `- Rows kept unchanged: ${report.summary.keptUnchanged}`,
    `- Rows rewritten: ${report.summary.rewritten}`,
    `- Rows reverted closer to CSS-aligned surfaces: ${report.summary.revertedCloserToCssAlignedSurfaces}`,
    `- Content-heavy rows before cleanup: ${report.summary.previousContentHeavyRows}`,
    `- Content-heavy rows after cleanup: ${report.summary.currentContentHeavyRows}`,
    '',
    '## Reviewed Rows',
    '',
    '| App | Logical Key | Action | Divergence Remains | Divergence Now Relational/Contextual |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const row of report.rows) {
    lines.push(
      `| ${row.appId} | ${row.logicalKey} | ${renderAction(row.actionTaken)} | ${row.divergenceRemains ? 'yes' : 'no'} | ${row.divergenceIsRelationalContextual ? 'yes' : 'no'} |`,
    );
  }

  lines.push('');
  for (const row of report.rows) {
    lines.push(`## ${row.appId} :: ${row.logicalKey}`);
    lines.push('');
    lines.push(`- CSS comparator: \`${row.cssComparator}\``);
    lines.push(`- Old XPath: \`${row.oldXPath}\``);
    lines.push(`- Final XPath: \`${row.finalXPath}\``);
    lines.push(`- Reason flagged: ${row.reasonFlagged}`);
    lines.push(`- Action taken: ${renderAction(row.actionTaken)}`);
    lines.push(`- Rationale: ${row.rationale}`);
    lines.push(`- Expected mutation sensitivity after cleanup: ${row.expectedMutationSensitivity}`);
    lines.push(`- Divergence remains: ${row.divergenceRemains ? 'yes' : 'no'}`);
    lines.push(
      `- Divergence is now relational/contextual rather than content-driven: ${row.divergenceIsRelationalContextual ? 'yes' : 'no'}`,
    );
    lines.push('');
  }

  return lines.join('\n');
}

export function renderXPathCleanupRiskNote(report: XPathCleanupAuditReport): string {
  const lines: string[] = [
    '# XPath Cleanup Benchmark-Risk Note',
    '',
    'The risky cases in this cleanup were XPath rows that had become different from CSS mainly by leaning on exact copy, normalized visible strings, placeholder text, or similar content-facing anchors even though the UI already exposed a stronger structural or contextual contract.',
    '',
    'This cleanup did three things:',
    '',
    '- moved button, navbar, feed-tab, and title rows off text-driven XPath variants when the relational or structural contract was already available;',
    '- kept XPath distinct where the distinction is now expressed through ancestor/descendant context, repeated-container predicates, or form ownership;',
    '- accepted honest overlap when the earlier divergence was not methodologically defensible.',
    '',
    `Reviewed suspicious rows: ${report.summary.reviewedRows}. Remaining justified content-heavy rows: ${report.summary.currentContentHeavyRows}.`,
    '',
    'The benchmark is therefore harder to criticize on the specific claim that XPath was made artificially weak by copy-sensitive rewrites. Remaining limitations are still real: some rows now overlap more closely with CSS than before, and a small number of fields may still rely on accessibility-facing contracts when those contracts are genuinely the most stable element identity available in that app.',
    '',
  ];

  if (report.summary.remainingJustifiedContentHeavyRows.length) {
    lines.push('Remaining justified content-heavy rows:');
    lines.push('');
    for (const row of report.summary.remainingJustifiedContentHeavyRows) {
      lines.push(`- ${row}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function writeXPathCleanupAuditReports(report: XPathCleanupAuditReport): void {
  const reportsDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(reportsDir, 'realworld-xpath-cleanup-audit.json'),
    JSON.stringify(report, null, 2),
  );
  fs.writeFileSync(
    path.join(reportsDir, 'realworld-xpath-cleanup-audit.md'),
    renderXPathCleanupAuditMarkdown(report),
  );
  fs.writeFileSync(
    path.join(reportsDir, 'realworld-xpath-cleanup-risk-note.md'),
    renderXPathCleanupRiskNote(report),
  );
}
