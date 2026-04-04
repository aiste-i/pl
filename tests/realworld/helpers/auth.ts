import { Page, expect } from '@playwright/test';
import { appPaths, pathRegex } from './app';

export async function register(page: Page, locators: any, username: string, email: string, password: string) {
  await page.goto(appPaths.register(), { waitUntil: 'load' });
  await locators.auth.usernameInput().fill(username);
  await locators.auth.emailInput().fill(email);
  await locators.auth.passwordInput().fill(password);

  // Wait for navigation to complete or error to appear
  try {
    await Promise.all([page.waitForURL(pathRegex(appPaths.home())), locators.auth.submitButton().click()]);
  } catch (error) {
    // If navigation fails, check for errors
    const errorMsg = await locators.auth.errorList().raw.textContent().catch(() => '');
    if (errorMsg) {
      throw new Error(`Registration failed: ${errorMsg}`);
    }
    throw error;
  }
}

export async function login(page: Page, locators: any, email: string, password: string) {
  await page.goto(appPaths.login(), { waitUntil: 'load' });
  await locators.auth.emailInput().fill(email);
  await locators.auth.passwordInput().fill(password);

  // Wait for navigation to complete or error to appear
  try {
    await Promise.all([page.waitForURL(pathRegex(appPaths.home())), locators.auth.submitButton().click()]);
  } catch (error) {
    // If navigation fails, check for errors
    const errorMsg = await locators.auth.errorList().raw.textContent().catch(() => '');
    if (errorMsg) {
      throw new Error(`Login failed: ${errorMsg}`);
    }
    throw error;
  }
}

export async function logout(page: Page, locators: any) {
  await locators.nav.settingsLink().click();
  await Promise.all([page.waitForURL(pathRegex(appPaths.home())), locators.settings.logoutButton().click()]);
  await expect(locators.nav.loginLink().raw.first()).toBeVisible();
}

export function generateUniqueUser() {
  const timestamp = Date.now();
  return {
    username: `testuser${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'password123',
  };
}
