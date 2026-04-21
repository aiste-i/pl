import fs from 'fs';
import path from 'path';
import { REALWORLD_APP_IDS, getAppAdapter } from '../../apps';
import type { SupportedAppId } from '../../apps/types';
import { getActiveLogicalKeys } from '../../benchmark/realworld-corpus';
import type { RealWorldLogicalKey } from './keys';
import { getByLogicalKey, getLocatorMeta } from '../apps/shared-realworld';

type BenchmarkLocatorFamily = 'css' | 'xpath';
type ComparableSurface =
  | 'class'
  | 'attribute'
  | 'text'
  | 'relational-structure'
  | 'accessibility-attribute';

interface SelectorSnapshot {
  css: string;
  xpath: string;
}

interface SurfaceDescription {
  primarySurface: string;
  comparableSurface: ComparableSurface;
}

interface RationaleRow {
  css: string;
  xpath: string;
  cssSensitivity: string;
  xpathSensitivity: string;
}

export interface CssXpathAuditRow {
  appId: SupportedAppId;
  logicalKey: RealWorldLogicalKey;
  currentCssLocator: string;
  currentXpathLocator: string;
  currentCssPrimarySurface: string;
  currentXpathPrimarySurface: string;
  currentPairRelationship: 'matched-surface' | 'family-distinct';
  refactoredCssLocator: string;
  refactoredXpathLocator: string;
  refactoredCssPrimarySurface: string;
  refactoredXpathPrimarySurface: string;
  refactoredPairRelationship: 'matched-surface' | 'family-distinct';
  cssRationale: string;
  xpathRationale: string;
  cssExpectedMutationSensitivity: string;
  xpathExpectedMutationSensitivity: string;
}

export interface CssXpathAuditReport {
  generatedAt: string;
  auditedLogicalKeyCount: number;
  auditedRowCount: number;
  overlapAudit: {
    currentMatchedSurfaceCount: number;
    currentMatchedSurfacePct: string;
    currentFamilyDistinctCount: number;
    currentFamilyDistinctPct: string;
    refactoredMatchedSurfaceCount: number;
    refactoredMatchedSurfacePct: string;
    refactoredFamilyDistinctCount: number;
    refactoredFamilyDistinctPct: string;
  };
  rows: CssXpathAuditRow[];
}

const BASELINE_SELECTORS: Record<string, Partial<Record<RealWorldLogicalKey, SelectorSnapshot>>> = {
  'angular-realworld-example-app': {
    'nav.navbar': {
      css: 'nav.navbar',
      xpath: '(//nav[contains(@class,"navbar")])[1]',
    },
    'nav.brandLink': {
      css: 'nav.navbar a.navbar-brand',
      xpath: '(//nav[contains(@class,"navbar")]//a[contains(@class,"navbar-brand")])[1]',
    },
    'auth.emailInput': {
      css: 'form input[name="email"]',
      xpath: '(//form//input[@name="email"])[1]',
    },
    'auth.passwordInput': {
      css: 'form input[name="password"]',
      xpath: '(//form//input[@name="password"])[1]',
    },
    'auth.submitButton': {
      css: 'form button[type="submit"]',
      xpath: '(//form//button[@type="submit"])[1]',
    },
    'nav.globalFeedTab': {
      css: '.feed-toggle a.nav-link[href="/"]',
      xpath: '(//div[contains(@class,"feed-toggle")]//a[contains(@class,"nav-link") and @href="/"])[1]',
    },
    'home.firstReadMoreLink': {
      css: '.article-list > app-article-preview:first-of-type a.preview-link',
      xpath: '((//div[contains(@class,"article-list")]/app-article-preview)[1]//a[contains(@class,"preview-link")])[1]',
    },
    'comments.textarea': {
      css: 'form.comment-form textarea[placeholder="Write a comment..."]',
      xpath: '(//form[contains(@class,"comment-form")]//textarea[contains(@placeholder,"Write a comment")])[1]',
    },
    'comments.submitButton': {
      css: 'form.comment-form button[type="submit"]',
      xpath: '(//form[contains(@class,"comment-form")]//button[@type="submit"])[1]',
    },
    'settings.bioInput': {
      css: 'form textarea[name="bio"]',
      xpath: '(//form//textarea[@name="bio"])[1]',
    },
    'settings.submitButton': {
      css: 'form button[type="submit"]',
      xpath: '(//form//button[@type="submit"])[1]',
    },
    'article.favoriteButton': {
      css: '.article-page .banner button[aria-label="Favorite article"]',
      xpath: '//div[contains(@class,"article-page")]//div[contains(@class,"banner")]//button[@aria-label="Favorite article"]',
    },
    'home.previewDescription': {
      css: 'a.preview-link > p',
      xpath: '(.//a[contains(@class,"preview-link")]//p)[1]',
    },
    'comments.deleteButton': {
      css: 'button[aria-label="Delete comment"]',
      xpath: './/button[@aria-label="Delete comment"]',
    },
    'article.title': {
      css: '.article-page .banner h1',
      xpath: '(//div[contains(@class,"article-page")]//div[contains(@class,"banner")]//h1)[1]',
    },
    'home.paginationButton': {
      css: '.pagination button.page-link[aria-label]',
      xpath: '//ul[contains(@class,"pagination")]//button[@aria-label="Go to page N"]',
    },
    'home.paginationItem': {
      css: '.pagination li.page-item',
      xpath: '//ul[contains(@class,"pagination")]//li[contains(@class,"page-item") and .//button[@aria-label="Go to page N"]]',
    },
    'profile.followButton': {
      css: '.profile-page .user-info button[aria-label="Follow user"]',
      xpath: '//div[contains(@class,"user-info")]//button[@aria-label="Follow user"]',
    },
    'profile.unfollowButton': {
      css: '.profile-page .user-info button[aria-label="Unfollow user"]',
      xpath: '//div[contains(@class,"user-info")]//button[@aria-label="Unfollow user"]',
    },
  },
  realworld: {
    'nav.navbar': {
      css: 'nav.navbar',
      xpath: '(//nav[contains(@class,"navbar")])[1]',
    },
    'nav.brandLink': {
      css: 'nav.navbar a.navbar-brand',
      xpath: '(//nav[contains(@class,"navbar")]//a[contains(@class,"navbar-brand")])[1]',
    },
    'auth.emailInput': {
      css: 'form input[name="email"]',
      xpath: '(//form//input[@name="email"])[1]',
    },
    'auth.passwordInput': {
      css: 'form input[name="password"]',
      xpath: '(//form//input[@name="password"])[1]',
    },
    'auth.submitButton': {
      css: 'form button[type="submit"]',
      xpath: '(//form//button[@type="submit"])[1]',
    },
    'nav.globalFeedTab': {
      css: '.feed-toggle a.nav-link[href="/?tab=all"]',
      xpath: '(//div[contains(@class,"feed-toggle")]//a[contains(@class,"nav-link") and @href="/?tab=all"])[1]',
    },
    'home.firstReadMoreLink': {
      css: '.article-preview:first-of-type a.preview-link',
      xpath: '(//div[contains(@class,"article-preview")])[1]//a[contains(@class,"preview-link")]',
    },
    'comments.textarea': {
      css: 'form.comment-form textarea[name="comment"]',
      xpath: '(//form[contains(@class,"comment-form")]//textarea[@name="comment"])[1]',
    },
    'comments.submitButton': {
      css: 'form.comment-form button[type="submit"]',
      xpath: '(//form[contains(@class,"comment-form")]//button[@type="submit"])[1]',
    },
    'settings.bioInput': {
      css: 'form textarea[name="bio"]',
      xpath: '(//form//textarea[@name="bio"])[1]',
    },
    'settings.submitButton': {
      css: 'form button.btn-primary',
      xpath: '(//form//button[contains(@class,"btn-primary")])[1]',
    },
    'article.favoriteButton': {
      css: '.article-page button[aria-label="Favorite article"]',
      xpath: '//div[contains(@class,"article-page")]//button[@aria-label="Favorite article"]',
    },
    'home.previewDescription': {
      css: 'a.preview-link > p',
      xpath: '(.//a[contains(@class,"preview-link")]//p)[1]',
    },
    'comments.deleteButton': {
      css: 'button[aria-label="Delete comment"]',
      xpath: './/button[@aria-label="Delete comment"]',
    },
    'article.title': {
      css: '.article-page .banner h1',
      xpath: '(//div[contains(@class,"article-page")]//div[contains(@class,"banner")]//h1)[1]',
    },
    'home.paginationButton': {
      css: '.pagination a.page-link[aria-label]',
      xpath: '//ul[contains(@class,"pagination")]//a[@aria-label="Go to page N"]',
    },
    'home.paginationItem': {
      css: '.pagination li.page-item',
      xpath: '//ul[contains(@class,"pagination")]//li[contains(@class,"page-item") and .//a[@aria-label="Go to page N"]]',
    },
    'profile.followButton': {
      css: '.profile-page .user-info button[aria-label="Follow user"]',
      xpath: '//div[contains(@class,"user-info")]//button[@aria-label="Follow user"]',
    },
    'profile.unfollowButton': {
      css: '.profile-page .user-info button[aria-label="Unfollow user"]',
      xpath: '//div[contains(@class,"user-info")]//button[@aria-label="Unfollow user"]',
    },
  },
  'vue3-realworld-example-app': {
    'nav.navbar': {
      css: 'nav.navbar',
      xpath: '(//nav[contains(@class,"navbar")])[1]',
    },
    'nav.brandLink': {
      css: 'nav.navbar a.navbar-brand',
      xpath: '(//nav[contains(@class,"navbar")]//a[contains(@class,"navbar-brand")])[1]',
    },
    'auth.emailInput': {
      css: 'form input[type="email"][placeholder="Email"]',
      xpath: '(//form//input[@type="email" and @placeholder="Email"])[1]',
    },
    'auth.passwordInput': {
      css: 'form input[type="password"][placeholder="Password"]',
      xpath: '(//form//input[@type="password" and @placeholder="Password"])[1]',
    },
    'auth.submitButton': {
      css: 'form button[type="submit"]',
      xpath: '(//form//button[@type="submit"])[1]',
    },
    'nav.globalFeedTab': {
      css: 'nav a.nav-link[href="#/"]',
      xpath: '(//nav//a[contains(@class,"nav-link") and @href="#/"])[1]',
    },
    'home.firstReadMoreLink': {
      css: '.article-list .article-preview:first-of-type a[href^="#/article/"]',
      xpath: '((//div[contains(@class,"article-list")]//*[contains(@class,"article-preview")])[1]//a[starts-with(@href,"#/article/")])[1]',
    },
    'comments.textarea': {
      css: 'form.comment-form textarea[placeholder="Write a comment..."]',
      xpath: '(//form[contains(@class,"comment-form")]//textarea[contains(@placeholder,"Write a comment")])[1]',
    },
    'comments.submitButton': {
      css: 'form.comment-form button[type="submit"]',
      xpath: '(//form[contains(@class,"comment-form")]//button[@type="submit"])[1]',
    },
    'settings.bioInput': {
      css: 'form textarea[aria-label="Bio"]',
      xpath: '(//form//textarea[@aria-label="Bio"])[1]',
    },
    'settings.submitButton': {
      css: 'form button[type="submit"]',
      xpath: '(//form//button[@type="submit"])[1]',
    },
    'article.favoriteButton': {
      css: '.banner .article-meta button[aria-label="Favorite article"]',
      xpath: '//div[contains(@class,"banner")]//div[contains(@class,"article-meta")]//button[@aria-label="Favorite article"]',
    },
    'home.previewDescription': {
      css: 'a.preview-link > p',
      xpath: '(.//a[contains(@class,"preview-link")]//p)[1]',
    },
    'comments.deleteButton': {
      css: '[role="button"][aria-label="Delete comment"]',
      xpath: './/*[@role="button" and @aria-label="Delete comment"]',
    },
    'article.title': {
      css: '.article-page .banner h1',
      xpath: '(//div[contains(@class,"article-page")]//div[contains(@class,"banner")]//h1)[1]',
    },
    'home.paginationButton': {
      css: '.pagination a.page-link',
      xpath: '//ul[contains(@class,"pagination")]//a[@aria-label="Go to page N"]',
    },
    'home.paginationItem': {
      css: '.pagination li.page-item',
      xpath: '//ul[contains(@class,"pagination")]//li[contains(@class,"page-item") and .//a[@aria-label="Go to page N"]]',
    },
    'profile.followButton': {
      css: '.profile-page .user-info button[aria-label="Follow user"]',
      xpath: '//div[contains(@class,"user-info")]//button[@aria-label="Follow user"]',
    },
    'profile.unfollowButton': {
      css: '.profile-page .user-info button[aria-label="Unfollow user"]',
      xpath: '//div[contains(@class,"user-info")]//button[@aria-label="Unfollow user"]',
    },
  },
};

const RATIONALES: Partial<Record<RealWorldLogicalKey, RationaleRow>> = {
  'nav.navbar': {
    css: 'Keeps the navbar as a short class-token selector because practitioners usually preserve the top-level navbar shell as a stable component anchor.',
    xpath: 'Uses descendant context from the conduit brand text so XPath leans on relational meaning instead of repeating the same navbar class chain.',
    cssSensitivity: 'Most sensitive to class-token churn on the outer shell; less sensitive to descendant reshaping inside the navbar.',
    xpathSensitivity: 'More sensitive to brand-text changes and descendant context mutations than to simple navbar wrapper refactors.',
  },
  'nav.brandLink': {
    css: 'Uses the concise brand class inside the navbar because that is the idiomatic CSS anchor for a top-level brand link.',
    xpath: 'Uses normalized brand text within navbar context so XPath expresses a relational target rather than another class transliteration.',
    cssSensitivity: 'Most sensitive to class renames on the brand link or navbar shell.',
    xpathSensitivity: 'Most sensitive to visible-brand text changes and text-structure mutations; less sensitive to added wrappers.',
  },
  'auth.emailInput': {
    css: 'Prefers the direct form-field attribute anchor that an engineer would realistically keep for a sign-in form input.',
    xpath: 'Scopes the same control through auth-page context so XPath uses broader descendant structure instead of a bare form transliteration.',
    cssSensitivity: 'Most sensitive to name/type attribute rewrites on the control itself.',
    xpathSensitivity: 'More sensitive to auth-page restructuring and ancestor rewrites than to minor sibling changes.',
  },
  'auth.passwordInput': {
    css: 'Keeps a short input attribute selector because the form-control field surface is the cleanest CSS expression.',
    xpath: 'Uses auth-page descendant context to make the XPath locator intentionally relational rather than syntax-twin CSS.',
    cssSensitivity: 'Most sensitive to direct control attribute changes.',
    xpathSensitivity: 'More sensitive to context moves and intermediate wrapper mutations.',
  },
  'auth.submitButton': {
    css: 'Uses the submit-button contract because CSS is strongest when the control already exposes a direct stable attribute.',
    xpath: 'Uses normalized button text so XPath can lean on relational/text meaning rather than just @type.',
    cssSensitivity: 'Most sensitive to submit-type or button-class changes; less sensitive to label wording.',
    xpathSensitivity: 'Most sensitive to wording changes, text wrappers, and ambiguity from nearby similar buttons.',
  },
  'nav.globalFeedTab': {
    css: 'Anchors the tab through its feed-toggle container plus href because that is the shortest stable CSS expression available in the RealWorld apps.',
    xpath: 'Uses visible tab text inside the local toggle context so XPath captures relational meaning that CSS does not express as cleanly.',
    cssSensitivity: 'Most sensitive to href rewrites or nav-link class churn.',
    xpathSensitivity: 'Most sensitive to tab text changes, text wrapping, and nearby duplicate feed labels.',
  },
  'home.firstReadMoreLink': {
    css: 'Uses local card scoping plus the preview-link surface because that is the idiomatic CSS way to target the first article CTA.',
    xpath: 'Uses repeated-container context plus a descendant heading predicate so XPath can exploit card-relative meaning.',
    cssSensitivity: 'Most sensitive to repeated-card order changes, first-item shifts, and class-token churn.',
    xpathSensitivity: 'More sensitive to card hierarchy reshaping and descendant predicate changes than to simple attribute swaps.',
  },
  'comments.textarea': {
    css: 'Uses the comment-form control surface directly because placeholder/name attributes are the cleanest CSS anchors for this field.',
    xpath: 'Adds local form-block context so XPath reflects component structure instead of mirroring the same bare textarea attributes.',
    cssSensitivity: 'Most sensitive to placeholder/name attribute changes on the textarea itself.',
    xpathSensitivity: 'More sensitive to wrapper insertion, footer/block rewrites, and label-mechanism changes.',
  },
  'comments.submitButton': {
    css: 'Uses footer-scoped submit-button classes because a practitioner would normally keep a short footer > button selector here.',
    xpath: 'Uses normalized button text inside footer context so XPath emphasizes relational meaning rather than only @type.',
    cssSensitivity: 'Most sensitive to footer/button class churn and direct submit-surface changes.',
    xpathSensitivity: 'Most sensitive to wording changes, button-text wrapping, and footer hierarchy mutations.',
  },
  'settings.bioInput': {
    css: 'Uses the textarea field contract directly because CSS is strongest on the control surface exposed by the settings form.',
    xpath: 'Adds settings-page context so XPath is anchored by page structure rather than a bare textarea transliteration.',
    cssSensitivity: 'Most sensitive to field attribute changes on the textarea itself.',
    xpathSensitivity: 'More sensitive to settings-page restructuring and ancestor-depth mutations.',
  },
  'settings.submitButton': {
    css: 'Uses the visible submit button classes because that is the concise CSS a maintainer would actually keep.',
    xpath: 'Uses normalized button text inside settings-page context so XPath leans on relational and text meaning.',
    cssSensitivity: 'Most sensitive to button class churn and button-type changes.',
    xpathSensitivity: 'Most sensitive to wording changes and structural shifts around the form action area.',
  },
  'article.favoriteButton': {
    css: 'Uses the action button inside the article meta region because CSS is strongest on a short meta-scoped button selector.',
    xpath: 'Uses article-meta ancestor context so XPath captures local relational meaning instead of another global button attribute selector.',
    cssSensitivity: 'Most sensitive to action-button class churn and aria-label changes.',
    xpathSensitivity: 'More sensitive to meta-region restructuring, wrapper insertion, and relational context swaps.',
  },
  'home.previewDescription': {
    css: 'Uses the direct preview paragraph with its role/attribute surface because CSS reads best when it stays on the rendered content node.',
    xpath: 'Uses descendant note context under the preview link so XPath can express relational content lookup explicitly.',
    cssSensitivity: 'Most sensitive to role or attribute removal on the paragraph and to direct wrapper changes.',
    xpathSensitivity: 'Most sensitive to descendant-text restructuring, wrapper insertion, and accessible-name source rewrites.',
  },
  'comments.deleteButton': {
    css: 'Uses the delete control inside the comment footer because CSS is strongest on short local container scoping.',
    xpath: 'Uses footer-relative descendant context so XPath is intentionally more structural than the CSS form.',
    cssSensitivity: 'Most sensitive to direct aria-label and footer-class changes.',
    xpathSensitivity: 'More sensitive to comment-footer restructuring and nested control duplication.',
  },
  'article.title': {
    css: 'Keeps the banner heading selector short because that is the idiomatic CSS expression for the article title surface.',
    xpath: 'Uses normalized heading text within banner context so XPath encodes a meaningful heading lookup rather than a pure class chain.',
    cssSensitivity: 'Most sensitive to banner/heading class or tag changes.',
    xpathSensitivity: 'Most sensitive to text-node structure, heading replacement, and banner hierarchy rewrites.',
  },
  'home.paginationButton': {
    css: 'Uses direct-child pagination link/button scoping because CSS is good at concise parent-child contracts for pager controls.',
    xpath: 'Uses list-item predicates so XPath can model the button as a child of the selected pager item rather than a flat attribute lookup.',
    cssSensitivity: 'Most sensitive to direct-child disruptions such as wrapper insertion or button/link surface changes.',
    xpathSensitivity: 'Most sensitive to list-structure rewrites, sibling insertion, and item-level hierarchy changes.',
  },
  'home.paginationItem': {
    css: 'Uses :has()-style parent selection because CSS can express the pager item as the element containing the page control.',
    xpath: 'Uses a list-item predicate with the nested pager control because XPath naturally models relational container selection.',
    cssSensitivity: 'Most sensitive to child-control movement that invalidates the immediate parent relation.',
    xpathSensitivity: 'Most sensitive to broader list-item restructuring and predicate-target movement.',
  },
  'profile.followButton': {
    css: 'Uses the local user-info action button surface because this is the shortest maintainable CSS expression for the profile CTA.',
    xpath: 'Keeps the XPath scoped to the user-info container so it stays relational rather than another class-token transliteration.',
    cssSensitivity: 'Most sensitive to button class churn and aria-label changes.',
    xpathSensitivity: 'More sensitive to user-info container restructuring and inserted wrapper depth.',
  },
  'profile.unfollowButton': {
    css: 'Uses the local user-info action button surface because that is the idiomatic CSS anchor for the toggle control.',
    xpath: 'Uses the user-info container context so XPath stays relational and distinct from the CSS selector surface.',
    cssSensitivity: 'Most sensitive to button class churn and aria-label changes.',
    xpathSensitivity: 'More sensitive to user-info container restructuring and relational ambiguity.',
  },
};

function readCurrentSelector(appId: SupportedAppId, logicalKey: RealWorldLogicalKey, family: BenchmarkLocatorFamily): string {
  const adapter = getAppAdapter(appId);
  const factory = getByLogicalKey(adapter.getLocators(family), logicalKey);
  const meta = getLocatorMeta(factory);

  if (!meta?.selector) {
    throw new Error(`Missing ${family} selector metadata for ${appId} ${logicalKey}`);
  }

  return meta.selector;
}

function describeCssSurface(selector: string): SurfaceDescription {
  if (selector.includes(':has(')) {
    return { primarySurface: 'parent-relational', comparableSurface: 'relational-structure' };
  }
  if (/\[aria-[^\]]+\]/.test(selector)) {
    return { primarySurface: 'accessibility-attribute', comparableSurface: 'accessibility-attribute' };
  }
  if (/\[[^\]]+\]/.test(selector) && /[>+~]/.test(selector)) {
    return { primarySurface: 'scoped-attribute-structure', comparableSurface: 'attribute' };
  }
  if (/\[[^\]]+\]/.test(selector)) {
    return { primarySurface: 'attribute-selector', comparableSurface: 'attribute' };
  }
  if (/[>+~]/.test(selector)) {
    return { primarySurface: 'scoped-structure', comparableSurface: 'relational-structure' };
  }
  if (/\.[A-Za-z0-9_-]+/.test(selector)) {
    return { primarySurface: 'class-token', comparableSurface: 'class' };
  }
  return { primarySurface: 'tag-structure', comparableSurface: 'relational-structure' };
}

function describeXpathSurface(selector: string): SurfaceDescription {
  if (/normalize-space\(\)|text\(\)/.test(selector)) {
    return { primarySurface: 'text-normalized', comparableSurface: 'text' };
  }
  if (/@aria-[A-Za-z-]+|@role\b|@placeholder\b/.test(selector)) {
    return { primarySurface: 'accessibility-attribute-predicate', comparableSurface: 'accessibility-attribute' };
  }
  if (/ancestor::|descendant::|following-sibling::|preceding-sibling::|self::/.test(selector)) {
    return { primarySurface: 'axis-relational', comparableSurface: 'relational-structure' };
  }
  if (/@href\b|@name\b|@type\b|@id\b/.test(selector)) {
    return { primarySurface: 'attribute-predicate', comparableSurface: 'attribute' };
  }
  if (/contains\(@class/.test(selector)) {
    return { primarySurface: 'class-context', comparableSurface: 'class' };
  }
  return { primarySurface: 'relational-structure', comparableSurface: 'relational-structure' };
}

function describeSurface(selector: string, family: BenchmarkLocatorFamily): SurfaceDescription {
  return family === 'css' ? describeCssSurface(selector) : describeXpathSurface(selector);
}

function relationFor(cssSelector: string, xpathSelector: string): 'matched-surface' | 'family-distinct' {
  const cssSurface = describeSurface(cssSelector, 'css');
  const xpathSurface = describeSurface(xpathSelector, 'xpath');
  return cssSurface.comparableSurface === xpathSurface.comparableSurface ? 'matched-surface' : 'family-distinct';
}

export function generateCssXpathAuditReport(): CssXpathAuditReport {
  const activeKeys = getActiveLogicalKeys();
  const rows: CssXpathAuditRow[] = [];

  for (const appId of REALWORLD_APP_IDS) {
    for (const logicalKey of activeKeys) {
      const baseline = BASELINE_SELECTORS[appId][logicalKey];
      if (!baseline) {
        throw new Error(`Missing baseline CSS/XPath audit snapshot for ${appId} ${logicalKey}`);
      }

      const refactoredCssLocator = readCurrentSelector(appId, logicalKey, 'css');
      const refactoredXpathLocator = readCurrentSelector(appId, logicalKey, 'xpath');
      const currentCssSurface = describeSurface(baseline.css, 'css');
      const currentXpathSurface = describeSurface(baseline.xpath, 'xpath');
      const refactoredCssSurface = describeSurface(refactoredCssLocator, 'css');
      const refactoredXpathSurface = describeSurface(refactoredXpathLocator, 'xpath');
      const rationale = RATIONALES[logicalKey];
      if (!rationale) {
        throw new Error(`Missing CSS/XPath audit rationale for ${logicalKey}`);
      }

      rows.push({
        appId,
        logicalKey,
        currentCssLocator: baseline.css,
        currentXpathLocator: baseline.xpath,
        currentCssPrimarySurface: currentCssSurface.primarySurface,
        currentXpathPrimarySurface: currentXpathSurface.primarySurface,
        currentPairRelationship: relationFor(baseline.css, baseline.xpath),
        refactoredCssLocator,
        refactoredXpathLocator,
        refactoredCssPrimarySurface: refactoredCssSurface.primarySurface,
        refactoredXpathPrimarySurface: refactoredXpathSurface.primarySurface,
        refactoredPairRelationship: relationFor(refactoredCssLocator, refactoredXpathLocator),
        cssRationale: rationale.css,
        xpathRationale: rationale.xpath,
        cssExpectedMutationSensitivity: rationale.cssSensitivity,
        xpathExpectedMutationSensitivity: rationale.xpathSensitivity,
      });
    }
  }

  const currentMatchedSurfaceCount = rows.filter(row => row.currentPairRelationship === 'matched-surface').length;
  const refactoredMatchedSurfaceCount = rows.filter(row => row.refactoredPairRelationship === 'matched-surface').length;
  const rowCount = rows.length;

  return {
    generatedAt: new Date().toISOString(),
    auditedLogicalKeyCount: activeKeys.length,
    auditedRowCount: rowCount,
    overlapAudit: {
      currentMatchedSurfaceCount,
      currentMatchedSurfacePct: (currentMatchedSurfaceCount / rowCount).toFixed(4),
      currentFamilyDistinctCount: rowCount - currentMatchedSurfaceCount,
      currentFamilyDistinctPct: ((rowCount - currentMatchedSurfaceCount) / rowCount).toFixed(4),
      refactoredMatchedSurfaceCount,
      refactoredMatchedSurfacePct: (refactoredMatchedSurfaceCount / rowCount).toFixed(4),
      refactoredFamilyDistinctCount: rowCount - refactoredMatchedSurfaceCount,
      refactoredFamilyDistinctPct: ((rowCount - refactoredMatchedSurfaceCount) / rowCount).toFixed(4),
    },
    rows,
  };
}

function renderAuditTable(rows: CssXpathAuditRow[]): string {
  const header = [
    '| Logical Key | Current CSS Surface | Current XPath Surface | Current Pair | Refactored CSS Surface | Refactored XPath Surface | Refactored Pair |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];

  const body = rows.map(row =>
    `| ${row.logicalKey} | ${row.currentCssPrimarySurface} | ${row.currentXpathPrimarySurface} | ${row.currentPairRelationship} | ${row.refactoredCssPrimarySurface} | ${row.refactoredXpathPrimarySurface} | ${row.refactoredPairRelationship} |`,
  );

  return [...header, ...body].join('\n');
}

export function renderCssXpathAuditMarkdown(report: CssXpathAuditReport): string {
  const lines: string[] = [
    '# RealWorld CSS/XPath Locator Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Overlap Audit',
    '',
    `- Current matched-surface rows: ${report.overlapAudit.currentMatchedSurfaceCount}/${report.auditedRowCount} (${report.overlapAudit.currentMatchedSurfacePct})`,
    `- Current family-distinct rows: ${report.overlapAudit.currentFamilyDistinctCount}/${report.auditedRowCount} (${report.overlapAudit.currentFamilyDistinctPct})`,
    `- Refactored matched-surface rows: ${report.overlapAudit.refactoredMatchedSurfaceCount}/${report.auditedRowCount} (${report.overlapAudit.refactoredMatchedSurfacePct})`,
    `- Refactored family-distinct rows: ${report.overlapAudit.refactoredFamilyDistinctCount}/${report.auditedRowCount} (${report.overlapAudit.refactoredFamilyDistinctPct})`,
    '',
  ];

  for (const appId of REALWORLD_APP_IDS) {
    lines.push(`## ${appId}`);
    lines.push('');
    lines.push(renderAuditTable(report.rows.filter(row => row.appId === appId)));
    lines.push('');
  }

  return lines.join('\n');
}

export function writeCssXpathAuditReports(report: CssXpathAuditReport): void {
  const reportsDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(reportsDir, 'realworld-css-xpath-locator-audit.json'),
    JSON.stringify(report, null, 2),
  );
  fs.writeFileSync(
    path.join(reportsDir, 'realworld-css-xpath-locator-audit.md'),
    renderCssXpathAuditMarkdown(report),
  );
}
