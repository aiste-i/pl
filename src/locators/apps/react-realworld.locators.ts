import type { Locator, Page } from '@playwright/test';
import type { StrategyName } from '..';
import {
  chooseStrategy,
  css,
  markSemantic,
  oracle,
  oracleTestId,
  semanticCssException,
  semanticNative,
  xpath,
} from './shared-realworld';

const APP_ID = 'realworld';
const MODULE_ID = 'src/locators/apps/react-realworld.locators.ts';

const meta = (logicalKey: string) => ({
  appId: APP_ID,
  moduleId: MODULE_ID,
  logicalKey,
});

const previewDescriptionException = {
  reason: 'Svelte article preview descriptions render as plain paragraph text without a stable semantic-only entry point.',
  activeInCorpus: true,
  affectsFairComparisonWording: true,
};

export function getReactRealWorldLocators(strategy: StrategyName) {
  return {
    nav: {
      navbar: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('nav.navbar'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('navigation').first(), 'getByRole'),
        ),
        css: css({ ...meta('nav.navbar'), selector: 'nav.navbar' }),
        xpath: xpath({ ...meta('nav.navbar'), selector: '(//nav[contains(@class,"navbar")])[1]' }),
      }),
      brandLink: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('nav.brandLink'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('link', { name: /conduit/i }).first(), 'getByRole'),
        ),
        css: css({ ...meta('nav.brandLink'), selector: 'nav.navbar a.navbar-brand' }),
        xpath: xpath({ ...meta('nav.brandLink'), selector: '(//nav[contains(@class,"navbar")]//a[contains(@class,"navbar-brand")])[1]' }),
      }),
      globalFeedTab: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('nav.globalFeedTab'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('link', { name: /^global feed$/i }).first(), 'getByRole'),
        ),
        css: css({ ...meta('nav.globalFeedTab'), selector: '.feed-toggle a.nav-link[href="/?tab=all"]' }),
        xpath: xpath({ ...meta('nav.globalFeedTab'), selector: '(//div[contains(@class,"feed-toggle")]//a[contains(@class,"nav-link") and @href="/?tab=all"])[1]' }),
      }),
    },
    auth: {
      emailInput: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('auth.emailInput'), semanticEntryPoint: 'getByPlaceholder' },
          (page: Page) => markSemantic(page.getByPlaceholder(/^email$/i), 'getByPlaceholder'),
        ),
        css: css({ ...meta('auth.emailInput'), selector: 'form input[name="email"]' }),
        xpath: xpath({ ...meta('auth.emailInput'), selector: '(//form//input[@name="email"])[1]' }),
      }),
      passwordInput: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('auth.passwordInput'), semanticEntryPoint: 'getByPlaceholder' },
          (page: Page) => markSemantic(page.getByPlaceholder(/^password$/i), 'getByPlaceholder'),
        ),
        css: css({ ...meta('auth.passwordInput'), selector: 'form input[name="password"]' }),
        xpath: xpath({ ...meta('auth.passwordInput'), selector: '(//form//input[@name="password"])[1]' }),
      }),
      submitButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('auth.submitButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /sign in|sign up/i }).first(), 'getByRole'),
        ),
        css: css({ ...meta('auth.submitButton'), selector: 'form button[type="submit"]' }),
        xpath: xpath({ ...meta('auth.submitButton'), selector: '(//form//button[@type="submit"])[1]' }),
      }),
    },
    home: {
      firstArticlePreview: chooseStrategy(strategy, {
        'semantic-first': semanticCssException(
          {
            ...meta('home.firstArticlePreview'),
            reason: 'Svelte article preview cards do not expose a stable semantic container handle for first-item selection.',
            cssSelector: '.article-preview:first-of-type',
            activeInCorpus: false,
            affectsFairComparisonWording: false,
          },
          (page: Page) => page.locator('.article-preview').first(),
        ),
        css: css(
          { ...meta('home.firstArticlePreview'), selector: '.article-preview:first-of-type' },
          (page: Page) => page.locator('.article-preview').first(),
        ),
        xpath: xpath(
          { ...meta('home.firstArticlePreview'), selector: '((//div[contains(@class,"article-preview")])[1])' },
          (page: Page) => page.locator('xpath=((//div[contains(@class,"article-preview")])[1])'),
        ),
      }),
      firstReadMoreLink: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('home.firstReadMoreLink'), semanticEntryPoint: 'getByRole' },
          (page: Page) =>
            markSemantic(
              page
                .getByRole('link')
                .filter({ has: page.getByText(/read more/i) })
                .first(),
              'getByRole',
            ),
        ),
        css: css({ ...meta('home.firstReadMoreLink'), selector: '.article-preview:first-of-type a.preview-link' }),
        xpath: xpath({ ...meta('home.firstReadMoreLink'), selector: '(//div[contains(@class,"article-preview")])[1]//a[contains(@class,"preview-link")]' }),
      }),
      previewDescription: chooseStrategy(strategy, {
        'semantic-first': semanticCssException(
          {
            ...meta('home.previewDescription'),
            cssSelector: 'a.preview-link > p',
            ...previewDescriptionException,
          },
          (preview: Locator) => preview.locator('a.preview-link > p').first(),
        ),
        css: css(
          { ...meta('home.previewDescription'), selector: 'a.preview-link > p' },
          (preview: Locator) => preview.locator('a.preview-link > p').first(),
        ),
        xpath: xpath(
          { ...meta('home.previewDescription'), selector: '(.//a[contains(@class,"preview-link")]//p)[1]' },
          (preview: Locator) => preview.locator('xpath=(.//a[contains(@class,"preview-link")]//p)[1]'),
        ),
      }),
      paginationButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('home.paginationButton'), semanticEntryPoint: 'getByRole' },
          (page: Page, pageNumber: number) =>
            markSemantic(page.getByRole('link', { name: new RegExp(`^go to page ${pageNumber}$`, 'i') }).first(), 'getByRole'),
        ),
        css: css(
          { ...meta('home.paginationButton'), selector: '.pagination a.page-link[aria-label]' },
          (page: Page, pageNumber: number) => page.locator(`.pagination a.page-link[aria-label="Go to page ${pageNumber}"]`),
        ),
        xpath: xpath(
          { ...meta('home.paginationButton'), selector: '//ul[contains(@class,"pagination")]//a[@aria-label="Go to page N"]' },
          (page: Page, pageNumber: number) =>
            page.locator(`xpath=//ul[contains(@class,"pagination")]//a[@aria-label="Go to page ${pageNumber}"]`),
        ),
      }),
      paginationItem: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('home.paginationItem'), semanticEntryPoint: 'getByRole' },
          (page: Page, pageNumber: number) =>
            markSemantic(
              page.getByRole('listitem').filter({ has: page.getByRole('link', { name: new RegExp(`^go to page ${pageNumber}$`, 'i') }) }).first(),
              'getByRole',
            ),
        ),
        css: css(
          { ...meta('home.paginationItem'), selector: '.pagination li.page-item' },
          (page: Page, pageNumber: number) =>
            page.locator('.pagination li.page-item').filter({ has: page.locator(`a.page-link[aria-label="Go to page ${pageNumber}"]`) }).first(),
        ),
        xpath: xpath(
          { ...meta('home.paginationItem'), selector: '//ul[contains(@class,"pagination")]//li[contains(@class,"page-item") and .//a[@aria-label="Go to page N"]]' },
          (page: Page, pageNumber: number) =>
            page.locator(`xpath=//ul[contains(@class,"pagination")]//li[contains(@class,"page-item") and .//a[@aria-label="Go to page ${pageNumber}"]]`),
        ),
      }),
    },
    article: {
      title: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('article.title'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('heading', { level: 1 }).first(), 'getByRole'),
        ),
        css: css({ ...meta('article.title'), selector: '.article-page .banner h1' }),
        xpath: xpath({ ...meta('article.title'), selector: '(//div[contains(@class,"article-page")]//div[contains(@class,"banner")]//h1)[1]' }),
      }),
      favoriteButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('article.favoriteButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /^favorite article\b/i }).first(), 'getByRole'),
        ),
        css: css(
          { ...meta('article.favoriteButton'), selector: '.article-page button[aria-label="Favorite article"]' },
          (page: Page) => page.locator('.article-page button[aria-label="Favorite article"]'),
        ),
        xpath: xpath(
          { ...meta('article.favoriteButton'), selector: '//div[contains(@class,"article-page")]//button[@aria-label="Favorite article"]' },
          (page: Page) => page.locator('xpath=//div[contains(@class,"article-page")]//button[@aria-label="Favorite article"]'),
        ),
      }),
      unfavoriteButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('article.unfavoriteButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /^unfavorite article\b/i }).first(), 'getByRole'),
        ),
        css: css(
          { ...meta('article.unfavoriteButton'), selector: '.article-page button[aria-label="Unfavorite article"]' },
          (page: Page) => page.locator('.article-page button[aria-label="Unfavorite article"]'),
        ),
        xpath: xpath(
          { ...meta('article.unfavoriteButton'), selector: '//div[contains(@class,"article-page")]//button[@aria-label="Unfavorite article"]' },
          (page: Page) => page.locator('xpath=//div[contains(@class,"article-page")]//button[@aria-label="Unfavorite article"]'),
        ),
      }),
    },
    comments: {
      textarea: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('comments.textarea'), semanticEntryPoint: 'getByPlaceholder' },
          (page: Page) => markSemantic(page.getByPlaceholder(/write a comment/i), 'getByPlaceholder'),
        ),
        css: css({ ...meta('comments.textarea'), selector: 'form.comment-form textarea[name="comment"]' }),
        xpath: xpath({ ...meta('comments.textarea'), selector: '(//form[contains(@class,"comment-form")]//textarea[@name="comment"])[1]' }),
      }),
      submitButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('comments.submitButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /post comment/i }).first(), 'getByRole'),
        ),
        css: css({ ...meta('comments.submitButton'), selector: 'form.comment-form button[type="submit"]' }),
        xpath: xpath({ ...meta('comments.submitButton'), selector: '(//form[contains(@class,"comment-form")]//button[@type="submit"])[1]' }),
      }),
      deleteButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('comments.deleteButton'), semanticEntryPoint: 'getByRole' },
          (commentRoot: Locator) => markSemantic(commentRoot.getByRole('button', { name: /delete comment/i }).first(), 'getByRole'),
        ),
        css: css(
          { ...meta('comments.deleteButton'), selector: 'button[aria-label="Delete comment"]' },
          (commentRoot: Locator) => commentRoot.locator('button[aria-label="Delete comment"]').first(),
        ),
        xpath: xpath(
          { ...meta('comments.deleteButton'), selector: './/button[@aria-label="Delete comment"]' },
          (commentRoot: Locator) => commentRoot.locator('xpath=.//button[@aria-label="Delete comment"]'),
        ),
      }),
    },
    profile: {
      followButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('profile.followButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /^follow user\b/i }).first(), 'getByRole'),
        ),
        css: css(
          { ...meta('profile.followButton'), selector: '.profile-page .user-info button[aria-label="Follow user"]' },
          (page: Page) => page.locator('.profile-page .user-info button[aria-label="Follow user"]'),
        ),
        xpath: xpath(
          { ...meta('profile.followButton'), selector: '//div[contains(@class,"user-info")]//button[@aria-label="Follow user"]' },
          (page: Page) => page.locator('xpath=//div[contains(@class,"user-info")]//button[@aria-label="Follow user"]'),
        ),
      }),
      unfollowButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('profile.unfollowButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /^unfollow user\b/i }).first(), 'getByRole'),
        ),
        css: css(
          { ...meta('profile.unfollowButton'), selector: '.profile-page .user-info button[aria-label="Unfollow user"]' },
          (page: Page) => page.locator('.profile-page .user-info button[aria-label="Unfollow user"]'),
        ),
        xpath: xpath(
          { ...meta('profile.unfollowButton'), selector: '//div[contains(@class,"user-info")]//button[@aria-label="Unfollow user"]' },
          (page: Page) => page.locator('xpath=//div[contains(@class,"user-info")]//button[@aria-label="Unfollow user"]'),
        ),
      }),
    },
    settings: {
      bioInput: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('settings.bioInput'), semanticEntryPoint: 'getByPlaceholder' },
          (page: Page) => markSemantic(page.getByPlaceholder(/short bio/i), 'getByPlaceholder'),
        ),
        css: css({ ...meta('settings.bioInput'), selector: 'form textarea[name="bio"]' }),
        xpath: xpath({ ...meta('settings.bioInput'), selector: '(//form//textarea[@name="bio"])[1]' }),
      }),
      submitButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('settings.submitButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /update settings/i }).first(), 'getByRole'),
        ),
        css: css({ ...meta('settings.submitButton'), selector: 'form button.btn-primary' }),
        xpath: xpath({ ...meta('settings.submitButton'), selector: '(//form//button[contains(@class,"btn-primary")])[1]' }),
      }),
    },
  };
}

export function getReactRealWorldOracle() {
  return {
    nav: {
      navbar: oracleTestId(meta('nav.navbar'), 'navbar'),
      brandLink: oracleTestId(meta('nav.brandLink'), 'navbar-brand'),
      globalFeedTab: oracleTestId(meta('nav.globalFeedTab'), 'nav-link-global-feed'),
      profileLink: oracle(
        { ...meta('nav.profileLink'), selector: "getByTestId('nav-link-profile')" },
        (page: Page, _username?: string) => page.getByTestId('nav-link-profile').first(),
      ),
    },
    auth: {
      title: oracleTestId(meta('auth.title'), 'auth-title'),
      emailInput: oracleTestId(meta('auth.emailInput'), 'auth-email-input'),
      usernameInput: oracleTestId(meta('auth.usernameInput'), 'auth-username-input'),
      passwordInput: oracleTestId(meta('auth.passwordInput'), 'auth-password-input'),
      submitButton: oracleTestId(meta('auth.submitButton'), 'auth-submit-button'),
    },
    home: {
      firstArticlePreview: oracle(
        { ...meta('home.firstArticlePreview'), selector: "getByTestId('article-preview')" },
        (page: Page) => page.getByTestId('article-preview').first(),
      ),
      firstReadMoreLink: oracle(
        { ...meta('home.firstReadMoreLink'), selector: "getByTestId('article-read-more')" },
        (page: Page) => page.getByTestId('article-read-more').first(),
      ),
      previewDescription: oracle(
        { ...meta('home.previewDescription'), selector: "getByTestId('article-description')" },
        (preview: Locator) => preview.getByTestId('article-description').first(),
      ),
      paginationButton: oracle(
        { ...meta('home.paginationButton'), selector: "getByTestId('pagination-link-${pageNumber}')" },
        (page: Page, pageNumber: number) => page.getByTestId(`pagination-link-${pageNumber}`),
      ),
      paginationItem: oracle(
        { ...meta('home.paginationItem'), selector: "getByTestId('pagination-item-${pageNumber}')" },
        (page: Page, pageNumber: number) => page.getByTestId(`pagination-item-${pageNumber}`),
      ),
    },
    article: {
      page: oracleTestId(meta('article.page'), 'article-page'),
      title: oracleTestId(meta('article.title'), 'article-title'),
      favoriteButton: oracleTestId(meta('article.favoriteButton'), 'article-favorite-btn'),
      unfavoriteButton: oracleTestId(meta('article.unfavoriteButton'), 'article-unfavorite-btn'),
    },
    comments: {
      textarea: oracleTestId(meta('comments.textarea'), 'comment-textarea'),
      submitButton: oracleTestId(meta('comments.submitButton'), 'comment-submit-button'),
      cards: oracle(
        { ...meta('comments.cards'), selector: "getByTestId('comment-card')" },
        (page: Page) => page.getByTestId('comment-card'),
      ),
      cardById: oracle(
        { ...meta('comments.cardById'), selector: "getByTestId('comment-card-${commentId}')" },
        (page: Page, commentId: number) => page.getByTestId(`comment-card-${commentId}`),
      ),
      card: oracle(
        { ...meta('comments.card'), selector: "getByTestId('comment-card')" },
        (page: Page, text: string) => page.getByTestId('comment-card').filter({ hasText: text }).first(),
      ),
      deleteButton: oracle(
        { ...meta('comments.deleteButton'), selector: "getByTestId('comment-delete-button')" },
        (commentRoot: Locator) => commentRoot.getByTestId('comment-delete-button').first(),
      ),
    },
    profile: {
      page: oracleTestId(meta('profile.page'), 'profile-page'),
      bio: oracleTestId(meta('profile.bio'), 'profile-bio'),
      followButton: oracleTestId(meta('profile.followButton'), 'profile-follow-btn'),
      unfollowButton: oracleTestId(meta('profile.unfollowButton'), 'profile-unfollow-btn'),
    },
    settings: {
      page: oracleTestId(meta('settings.page'), 'settings-page'),
      bioInput: oracleTestId(meta('settings.bioInput'), 'settings-bio-textarea'),
      submitButton: oracleTestId(meta('settings.submitButton'), 'settings-submit-button'),
    },
  };
}
