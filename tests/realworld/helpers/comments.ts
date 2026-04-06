import { expect, Page } from '@playwright/test';

async function readCommentIds(oracle: any): Promise<number[]> {
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

async function getStableCommentIds(
  oracle: any,
  page: Page,
  options: { timeoutMs?: number; intervalMs?: number; stableSamples?: number } = {},
): Promise<number[]> {
  const timeoutMs = options.timeoutMs ?? 10000;
  const intervalMs = options.intervalMs ?? 100;
  const stableSamples = options.stableSamples ?? 3;
  const deadline = Date.now() + timeoutMs;

  let lastIds: number[] = [];
  let stableCount = 0;

  while (Date.now() < deadline) {
    const currentIds = await readCommentIds(oracle);
    if (JSON.stringify(currentIds) === JSON.stringify(lastIds)) {
      stableCount += 1;
      if (stableCount >= stableSamples) {
        return currentIds;
      }
    } else {
      lastIds = currentIds;
      stableCount = 1;
    }
    await page.waitForTimeout(intervalMs);
  }

  return lastIds;
}

export async function addComment(page: Page, locators: any, oracle: any, commentText: string): Promise<number> {
  await locators.comments.textarea().raw.waitFor({ timeout: 10000 });
  const initialIds = await getStableCommentIds(oracle, page);

  await locators.comments.textarea().fill(commentText);
  await locators.comments.submitButton().click();

  const deadline = Date.now() + 10000;
  let commentId: number | null = null;
  while (Date.now() < deadline) {
    const currentIds = await readCommentIds(oracle);
    const candidateIds = currentIds.filter(id => !initialIds.includes(id));
    for (const candidateId of candidateIds) {
      const deleteButtonCount = await locators.comments.deleteButton(oracle.comments.cardById(candidateId)).raw.count();
      if (deleteButtonCount > 0) {
        commentId = candidateId;
        break;
      }
    }
    if (commentId !== null) {
      break;
    }
    await page.waitForTimeout(100);
  }

  expect(commentId, 'Expected the UI to render a stable comment-card-<id> after posting').not.toBeNull();
  return commentId!;
}

export async function deleteComment(locators: any, oracle: any, commentId: number) {
  const preDeleteCount = await oracle.comments.cards().raw.count();
  const commentCard = oracle.comments.cardById(commentId);
  await locators.comments.deleteButton(commentCard).click();

  await expect
    .poll(() => oracle.comments.cardById(commentId).raw.count(), { timeout: 10000 })
    .toBe(0);
  await expect
    .poll(() => oracle.comments.cards().raw.count(), { timeout: 10000 })
    .toBe(Math.max(preDeleteCount - 1, 0));
}

export async function getCommentCount(oracle: any): Promise<number> {
  return oracle.comments.cards().raw.count();
}
