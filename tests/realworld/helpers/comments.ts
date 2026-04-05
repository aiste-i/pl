import { expect, Page } from '@playwright/test';

async function getCommentIds(oracle: any): Promise<number[]> {
  const ids = await oracle.comments.cards().raw.evaluateAll(cards =>
    cards
      .map(card => {
        const nested = card.querySelector('[data-testid^="comment-card-"]');
        const value = nested?.getAttribute('data-testid') ?? null;
        const match = value ? /^comment-card-(\d+)$/.exec(value) : null;
        return match ? Number(match[1]) : null;
      })
      .filter((id): id is number => typeof id === 'number'),
  );

  return ids.sort((left, right) => left - right);
}

export async function addComment(page: Page, locators: any, oracle: any, commentText: string): Promise<number> {
  await locators.comments.textarea().raw.waitFor({ timeout: 10000 });
  const initialIds = await getCommentIds(oracle);

  await locators.comments.textarea().fill(commentText);
  await locators.comments.submitButton().click();

  const deadline = Date.now() + 10000;
  let commentId: number | null = null;
  while (Date.now() < deadline) {
    const currentIds = await getCommentIds(oracle);
    commentId = currentIds.find(id => !initialIds.includes(id)) ?? null;
    if (commentId !== null) {
      break;
    }
    await page.waitForTimeout(100);
  }

  expect(commentId, 'Expected the UI to render a stable comment-card-<id> after posting').not.toBeNull();
  return commentId!;
}

export async function deleteComment(locators: any, oracle: any, commentId: number) {
  const commentCard = oracle.comments.cardById(commentId);
  await locators.comments.deleteButton(commentCard).click();

  await expect
    .poll(() => oracle.comments.cardById(commentId).raw.count(), { timeout: 10000 })
    .toBe(0);
}

export async function getCommentCount(oracle: any): Promise<number> {
  return oracle.comments.cards().raw.count();
}
