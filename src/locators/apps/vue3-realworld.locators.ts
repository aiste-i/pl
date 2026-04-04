import type { Page } from '@playwright/test';
import type { StrategyName } from '..';
import {
  chooseStrategy,
  css,
  markSemantic,
  oracle,
  oracleTestId,
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
        css: css({ ...meta('home.firstReadMoreLink'), selector: '.article-list .article-preview:first-of-type a[href^="#/article/"]' }),
        xpath: xpath({ ...meta('home.firstReadMoreLink'), selector: '((//div[contains(@class,"article-list")]//*[contains(@class,"article-preview")])[1]//a[starts-with(@href,"#/article/")])[1]' }),
      }),
      paginationButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('home.paginationButton'), semanticEntryPoint: 'getByRole' },
          (page: Page, pageNumber: number) =>
            markSemantic(page.getByRole('link', { name: new RegExp(`(^${pageNumber}$|go to page ${pageNumber}$)`, 'i') }).first(), 'getByRole'),
        ),
        css: css(
          { ...meta('home.paginationButton'), selector: '.pagination a.page-link' },
          (page: Page, pageNumber: number) => page.locator(`.pagination a.page-link[aria-label="Go to page ${pageNumber}"]`).first(),
        ),
        xpath: xpath(
          { ...meta('home.paginationButton'), selector: '(//ul[contains(@class,"pagination")]//a[contains(@class,"page-link")])[1]' },
          (page: Page, pageNumber: number) =>
            page.locator(`xpath=(//ul[contains(@class,"pagination")]//a[contains(@class,"page-link") and (@aria-label="Go to page ${pageNumber}" or normalize-space()="${pageNumber}")])[1]`),
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
          { ...meta('home.paginationItem'), selector: '(//ul[contains(@class,"pagination")]//li[contains(@class,"page-item")])[1]' },
          (page: Page, pageNumber: number) =>
            page.locator(`xpath=(//ul[contains(@class,"pagination")]//li[contains(@class,"page-item") and .//a[@aria-label="Go to page ${pageNumber}"]])[1]`),
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
    },
    profile: {
      followButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('profile.followButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /^follow\b/i }).first(), 'getByRole'),
        ),
        css: css(
          { ...meta('profile.followButton'), selector: '.profile-page .user-info button.btn' },
          (page: Page) => page.locator('.profile-page .user-info button.btn', { hasText: /^Follow\b/i }).first(),
        ),
        xpath: xpath(
          { ...meta('profile.followButton'), selector: '(//div[contains(@class,"user-info")]//button)[1]' },
          (page: Page) => page.locator('xpath=(//div[contains(@class,"user-info")]//button[starts-with(normalize-space(),"Follow")])[1]'),
        ),
      }),
      unfollowButton: chooseStrategy(strategy, {
        'semantic-first': semanticNative(
          { ...meta('profile.unfollowButton'), semanticEntryPoint: 'getByRole' },
          (page: Page) => markSemantic(page.getByRole('button', { name: /^unfollow\b/i }).first(), 'getByRole'),
        ),
        css: css(
          { ...meta('profile.unfollowButton'), selector: '.profile-page .user-info button.btn' },
          (page: Page) => page.locator('.profile-page .user-info button.btn', { hasText: /^Unfollow\b/i }).first(),
        ),
        xpath: xpath(
          { ...meta('profile.unfollowButton'), selector: '(//div[contains(@class,"user-info")]//button)[1]' },
          (page: Page) => page.locator('xpath=(//div[contains(@class,"user-info")]//button[starts-with(normalize-space(),"Unfollow")])[1]'),
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
      profileLink: oracle(
        { ...meta('nav.profileLink'), selector: "getByTestId('nav-item')" },
        (page: Page, _username?: string) => page.getByTestId('nav-item').last(),
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
      firstReadMoreLink: oracle(
        { ...meta('home.firstReadMoreLink'), selector: "getByTestId('article-read-more')" },
        (page: Page) => page.getByTestId('article-read-more').first(),
      ),
      paginationButton: oracle(
        { ...meta('home.paginationButton'), selector: "getByTestId('pagination-link')" },
        (page: Page, pageNumber: number) => page.getByTestId('pagination-link').filter({ hasText: new RegExp(`^${pageNumber}$`) }).first(),
      ),
      paginationItem: oracle(
        { ...meta('home.paginationItem'), selector: "getByTestId('pagination-item')" },
        (page: Page, pageNumber: number) => page.getByTestId('pagination-item').filter({ hasText: new RegExp(`^${pageNumber}$`) }).first(),
      ),
    },
    article: {
      page: oracleTestId(meta('article.page'), 'article-page'),
    },
    comments: {
      textarea: oracleTestId(meta('comments.textarea'), 'comment-textarea'),
      submitButton: oracleTestId(meta('comments.submitButton'), 'comment-submit-button'),
      card: oracle(
        { ...meta('comments.card'), selector: "getByTestId('comment-card')" },
        (page: Page, text: string) => page.getByTestId('comment-card').filter({ hasText: text }).first(),
      ),
    },
    profile: {
      page: oracleTestId(meta('profile.page'), 'profile-page'),
      bio: oracle(
        { ...meta('profile.bio'), selector: "getByTestId('profile-page')" },
        (page: Page) => page.getByTestId('profile-page'),
      ),
      followButton: oracle(
        { ...meta('profile.followButton'), selector: "getByTestId('profile-follow-btn')" },
        (page: Page) => page.getByTestId('profile-follow-btn').filter({ hasText: /^Follow\b/i }).first(),
      ),
      unfollowButton: oracle(
        { ...meta('profile.unfollowButton'), selector: "getByTestId('profile-follow-btn')" },
        (page: Page) => page.getByTestId('profile-follow-btn').filter({ hasText: /^Unfollow\b/i }).first(),
      ),
    },
    settings: {
      page: oracleTestId(meta('settings.page'), 'settings-page'),
      bioInput: oracleTestId(meta('settings.bioInput'), 'settings-bio-textarea'),
      submitButton: oracleTestId(meta('settings.submitButton'), 'settings-submit-button'),
    },
  };
}
