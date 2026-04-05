import type { Locator, Page } from '@playwright/test';
import type { StrategyName } from '..';
import {
  chooseStrategy,
  css,
  markSemantic,
  oracle,
  oracleDynamicTestId,
  oracleTestIdChain,
  oracleTestId,
  semanticCssException,
  semanticNative,
  xpath,
} from './shared-realworld';

const APP_ID = 'vue3-realworld-example-app';
const MODULE_ID = 'src/locators/apps/vue3-realworld.locators.ts';

const meta = (logicalKey: string) => ({
  appId: APP_ID,
  moduleId: MODULE_ID,
  logicalKey,
});

const previewDescriptionException = {
  reason: 'Vue article preview descriptions render as plain paragraph text without a stable semantic-only entry point.',
  activeInCorpus: true,
  affectsFairComparisonWording: true,
};

export function getVue3RealWorldLocators(strategy: StrategyName) {
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
          (page: Page) => markSemantic(page.getByRole('link', { name: /^home$/i }).first(), 'getByRole'),
        ),
        css: css({ ...meta('nav.globalFeedTab'), selector: 'nav a.nav-link[href="#/"]' }),
        xpath: xpath({ ...meta('nav.globalFeedTab'), selector: '(//nav//a[contains(@class,"nav-link") and @href="#/"])[1]' }),
      }),
    },
    auth: {
      emailInput: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('auth.emailInput'), semanticEntryPoint: 'getByPlaceholder' },
          (page: Page) => markSemantic(page.getByPlaceholder(/^email$/i), 'getByPlaceholder'),
        ),
        css: css({ ...meta('auth.emailInput'), selector: 'form input[type="email"][placeholder="Email"]' }),
        xpath: xpath({ ...meta('auth.emailInput'), selector: '(//form//input[@type="email" and @placeholder="Email"])[1]' }),
      }),
      passwordInput: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('auth.passwordInput'), semanticEntryPoint: 'getByPlaceholder' },
          (page: Page) => markSemantic(page.getByPlaceholder(/^password$/i), 'getByPlaceholder'),
        ),
        css: css({ ...meta('auth.passwordInput'), selector: 'form input[type="password"][placeholder="Password"]' }),
        xpath: xpath({ ...meta('auth.passwordInput'), selector: '(//form//input[@type="password" and @placeholder="Password"])[1]' }),
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
            reason: 'Vue article preview cards do not expose a stable semantic container handle for first-item selection.',
            cssSelector: '.article-list .article-preview:first-of-type',
            activeInCorpus: false,
            affectsFairComparisonWording: false,
          },
          (page: Page) => page.locator('.article-list .article-preview').first(),
        ),
        css: css(
          { ...meta('home.firstArticlePreview'), selector: '.article-list .article-preview:first-of-type' },
          (page: Page) => page.locator('.article-list .article-preview').first(),
        ),
        xpath: xpath(
          { ...meta('home.firstArticlePreview'), selector: '((//div[contains(@class,"article-list")]//*[contains(@class,"article-preview")])[1])' },
          (page: Page) => page.locator('xpath=((//div[contains(@class,"article-list")]//*[contains(@class,"article-preview")])[1])'),
        ),
      }),
      firstReadMoreLink: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('home.firstReadMoreLink'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('link', { name: /read more/i }).first(), 'getByRole'),
        ),
        css: css({ ...meta('home.firstReadMoreLink'), selector: '.article-list .article-preview:first-of-type a[href^="#/article/"]' }),
        xpath: xpath({ ...meta('home.firstReadMoreLink'), selector: '((//div[contains(@class,"article-list")]//*[contains(@class,"article-preview")])[1]//a[starts-with(@href,"#/article/")])[1]' }),
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
            markSemantic(page.getByRole('link', { name: new RegExp(`(^${pageNumber}$|go to page ${pageNumber}$)`, 'i') }).first(), 'getByRole'),
        ),
        css: css(
          { ...meta('home.paginationButton'), selector: '.pagination a.page-link' },
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
              page
                .getByRole('listitem')
                .filter({ has: page.getByRole('link', { name: new RegExp(`(^${pageNumber}$|go to page ${pageNumber}$)`, 'i') }) })
                .first(),
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
          { ...meta('article.favoriteButton'), selector: '.banner .article-meta button[aria-label="Favorite article"]' },
          (page: Page) => page.locator('.banner .article-meta button[aria-label="Favorite article"]'),
        ),
        xpath: xpath(
          { ...meta('article.favoriteButton'), selector: '//div[contains(@class,"banner")]//div[contains(@class,"article-meta")]//button[@aria-label="Favorite article"]' },
          (page: Page) => page.locator('xpath=//div[contains(@class,"banner")]//div[contains(@class,"article-meta")]//button[@aria-label="Favorite article"]'),
        ),
      }),
      unfavoriteButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('article.unfavoriteButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /^unfavorite article\b/i }).first(), 'getByRole'),
        ),
        css: css(
          { ...meta('article.unfavoriteButton'), selector: '.banner .article-meta button[aria-label="Unfavorite article"]' },
          (page: Page) => page.locator('.banner .article-meta button[aria-label="Unfavorite article"]'),
        ),
        xpath: xpath(
          { ...meta('article.unfavoriteButton'), selector: '//div[contains(@class,"banner")]//div[contains(@class,"article-meta")]//button[@aria-label="Unfavorite article"]' },
          (page: Page) => page.locator('xpath=//div[contains(@class,"banner")]//div[contains(@class,"article-meta")]//button[@aria-label="Unfavorite article"]'),
        ),
      }),
    },
    comments: {
      textarea: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('comments.textarea'), semanticEntryPoint: 'getByPlaceholder' },
          (page: Page) => markSemantic(page.getByPlaceholder(/write a comment/i), 'getByPlaceholder'),
        ),
        css: css({ ...meta('comments.textarea'), selector: 'form.comment-form textarea[placeholder="Write a comment..."]' }),
        xpath: xpath({ ...meta('comments.textarea'), selector: '(//form[contains(@class,"comment-form")]//textarea[contains(@placeholder,"Write a comment")])[1]' }),
      }),
      submitButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('comments.submitButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /^submit$/i }).first(), 'getByRole'),
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
          { ...meta('comments.deleteButton'), selector: '[role="button"][aria-label="Delete comment"]' },
          (commentRoot: Locator) => commentRoot.locator('[role="button"][aria-label="Delete comment"]').first(),
        ),
        xpath: xpath(
          { ...meta('comments.deleteButton'), selector: './/*[@role="button" and @aria-label="Delete comment"]' },
          (commentRoot: Locator) => commentRoot.locator('xpath=.//*[@role="button" and @aria-label="Delete comment"]'),
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
        css: css({ ...meta('settings.bioInput'), selector: 'form textarea[aria-label="Bio"]' }),
        xpath: xpath({ ...meta('settings.bioInput'), selector: '(//form//textarea[@aria-label="Bio"])[1]' }),
      }),
      submitButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('settings.submitButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /update settings/i }).first(), 'getByRole'),
        ),
        css: css({ ...meta('settings.submitButton'), selector: 'form button[type="submit"]' }),
        xpath: xpath({ ...meta('settings.submitButton'), selector: '(//form//button[@type="submit"])[1]' }),
      }),
    },
  };
}

export function getVue3RealWorldOracle() {
  return {
    nav: {
      navbar: oracleTestId(meta('nav.navbar'), 'navbar'),
      brandLink: oracleTestId(meta('nav.brandLink'), 'navbar-brand'),
      globalFeedTab: oracleTestId(meta('nav.globalFeedTab'), 'nav-link-global-feed'),
      profileLink: oracleTestId(meta('nav.profileLink'), 'nav-link-profile'),
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
      favoriteButton: oracle(
        { ...meta('article.favoriteButton'), selector: "getByTestId('article-meta-top').getByTestId('article-favorite-btn')" },
        (page: Page) => page.getByTestId('article-meta-top').getByTestId('article-favorite-btn'),
      ),
      unfavoriteButton: oracle(
        { ...meta('article.unfavoriteButton'), selector: "getByTestId('article-meta-top').getByTestId('article-unfavorite-btn')" },
        (page: Page) => page.getByTestId('article-meta-top').getByTestId('article-unfavorite-btn'),
      ),
    },
    comments: {
      textarea: oracleTestId(meta('comments.textarea'), 'comment-textarea'),
      submitButton: oracleTestId(meta('comments.submitButton'), 'comment-submit-button'),
      cards: oracle(
        { ...meta('comments.cards'), selector: "getByTestId('comment-card')" },
        (page: Page) => page.getByTestId('comment-card'),
      ),
      cardById: oracleDynamicTestId(
        meta('comments.cardById'),
        'comment-card-${commentId}',
        (commentId: number) => `comment-card-${commentId}`,
      ),
      card: oracleDynamicTestId(
        meta('comments.card'),
        'comment-card-${commentId}',
        (commentId: number) => `comment-card-${commentId}`,
      ),
      deleteButton: oracleTestIdChain(
        meta('comments.deleteButton'),
        ['comment-delete-button'],
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
