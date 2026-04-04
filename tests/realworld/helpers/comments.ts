import { Page } from '@playwright/test';

export async function addComment(page: Page, locators: any, commentText: string) {
  // Assumes we're on an article page - wait for comment form to be ready
  await locators.comments.textarea().raw.waitFor({ timeout: 10000 });
  await locators.comments.textarea().fill(commentText);

  await locators.comments.submitButton().click();
  await locators.comments.card(commentText).raw.waitFor({ timeout: 10000 });
}

export async function deleteComment(page: Page, locators: any, commentText: string) {
  // Find the comment card containing the text and click its delete button
  const commentCard = locators.comments.card(commentText).raw;
  await locators.comments.deleteButton(commentCard).click();

  // Wait for comment to disappear
}

export async function getCommentCount(page: Page): Promise<number> {
  return page.getByTestId('comment-card').count();
}
