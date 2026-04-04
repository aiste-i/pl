import { Page } from '@playwright/test';
import { API_MODE } from './config';
import { appPaths } from './app';

export async function followUser(page: Page, locators: any, username: string) {
  await page.goto(appPaths.profile(username), { waitUntil: 'load' });
  // Wait for profile page to load and Follow button to appear
  await locators.profile.followButton().click();
  // Wait for button to update
  await locators.profile.unfollowButton().raw.waitFor({ timeout: 5000 });
}

export async function unfollowUser(page: Page, locators: any, username: string) {
  await page.goto(appPaths.profile(username), { waitUntil: 'load' });
  // Wait for profile page to load and Unfollow button to appear
  await locators.profile.unfollowButton().click();
  // Wait for button to update
  await locators.profile.followButton().raw.waitFor({ timeout: 5000 });
}

export async function updateProfile(
  page: Page,
  locators: any,
  updates: {
    image?: string;
    username?: string;
    bio?: string;
    email?: string;
    password?: string;
  },
) {
  await page.goto(appPaths.settings(), { waitUntil: 'load' });

  if (updates.image !== undefined) {
    await locators.settings.imageInput().fill(updates.image);
  }
  if (updates.username) {
    await locators.settings.usernameInput().fill(updates.username);
  }
  if (updates.bio !== undefined) {
    await locators.settings.bioInput().fill(updates.bio);
  }
  if (updates.email) {
    await locators.settings.emailInput().fill(updates.email);
  }
  if (updates.password) {
    await locators.settings.passwordInput().fill(updates.password);
  }

  if (API_MODE) {
    // Click submit and wait for API call to complete, then navigation
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/user') && response.request().method() === 'PUT'),
      page.waitForURL(url => !url.toString().includes('/settings')),
      locators.settings.submitButton().click(),
    ]);
  } else {
    // Click submit and wait for navigation away from settings
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/settings')),
      locators.settings.submitButton().click(),
    ]);
  }
}
