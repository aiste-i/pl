import type { Locator, Page } from '@playwright/test';
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

const APP_ID = 'angular-realworld-example-app';
const MODULE_ID = 'src/locators/apps/angular-realworld.locators.ts';

const meta = (logicalKey: string) => ({
  appId: APP_ID,
  moduleId: MODULE_ID,
  logicalKey,
});

export function getAngularRealWorldLocators(strategy: StrategyName) {
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
        css: css({ ...meta('nav.globalFeedTab'), selector: '.feed-toggle a.nav-link[href="/"]' }),
        xpath: xpath({ ...meta('nav.globalFeedTab'), selector: '(//div[contains(@class,"feed-toggle")]//a[contains(@class,"nav-link") and @href="/"])[1]' }),
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
        css: css({ ...meta('home.firstReadMoreLink'), selector: '.article-list > app-article-preview:first-of-type a.preview-link' }),
        xpath: xpath({ ...meta('home.firstReadMoreLink'), selector: '((//div[contains(@class,"article-list")]/app-article-preview)[1]//a[contains(@class,"preview-link")])[1]' }),
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
          (page: Page) => markSemantic(page.getByRole('button', { name: /post comment/i }).first(), 'getByRole'),
        ),
        css: css({ ...meta('comments.submitButton'), selector: 'form.comment-form button[type="submit"]' }),
        xpath: xpath({ ...meta('comments.submitButton'), selector: '(//form[contains(@class,"comment-form")]//button[@type="submit"])[1]' }),
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
        css: css({ ...meta('settings.submitButton'), selector: 'form button[type="submit"]' }),
        xpath: xpath({ ...meta('settings.submitButton'), selector: '(//form//button[@type="submit"])[1]' }),
      }),
    },
  };
}

export function getAngularRealWorldOracle() {
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
      firstReadMoreLink: oracle(
        { ...meta('home.firstReadMoreLink'), selector: "getByTestId('article-read-more')" },
        (page: Page) => page.getByTestId('article-read-more').first(),
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
      bio: oracleTestId(meta('profile.bio'), 'profile-bio'),
    },
    settings: {
      page: oracleTestId(meta('settings.page'), 'settings-page'),
      bioInput: oracleTestId(meta('settings.bioInput'), 'settings-bio-textarea'),
      submitButton: oracleTestId(meta('settings.submitButton'), 'settings-submit-button'),
    },
  };
}
