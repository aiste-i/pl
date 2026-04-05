import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';
import { WebMutator } from '../../src/webmutator/WebMutator';
import { SubtreeDelete } from '../../src/webmutator/operators/dom/SubtreeDelete';
import { ToggleCssClass } from '../../src/webmutator/operators/dom/ToggleCssClass';

const ORACLE_MODULES = [
  'src/locators/apps/angular-realworld.locators.ts',
  'src/locators/apps/react-realworld.locators.ts',
  'src/locators/apps/vue3-realworld.locators.ts',
];

const FORBIDDEN_ORACLE_PATTERNS = [
  '.filter(',
  'getByText(',
  'getByRole(',
  'getByLabel(',
  'getByPlaceholder(',
  'getByAltText(',
  'getByTitle(',
  'page.locator(',
  '.locator(',
];

function getOracleSection(contents: string): string {
  const marker = 'export function get';
  const oracleStart = contents.lastIndexOf(marker);
  if (oracleStart === -1) {
    throw new Error('Could not find oracle factory export.');
  }
  return contents.slice(oracleStart);
}

test('oracle locator factories stay on getByTestId-only chains', async () => {
  for (const relativePath of ORACLE_MODULES) {
    const contents = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
    const oracleSection = getOracleSection(contents);

    for (const pattern of FORBIDDEN_ORACLE_PATTERNS) {
      expect(
        oracleSection.includes(pattern),
        `${relativePath} oracle section should not contain ${pattern}`,
      ).toBe(false);
    }
  }
});

test('oracle helper paths avoid text-addressed repeated-element lookups', async () => {
  const helperFiles = [
    'tests/realworld/helpers/benchmark-active.ts',
    'tests/realworld/helpers/comments.ts',
  ];
  const forbiddenPatterns = [
    'filter({ hasText',
    'getByText(',
    "comment-card').filter",
  ];

  for (const relativePath of helperFiles) {
    const contents = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
    for (const pattern of forbiddenPatterns) {
      expect(contents.includes(pattern), `${relativePath} should not contain ${pattern}`).toBe(false);
    }
  }
});

test('mutator skips direct oracle nodes selected by data-testid', async ({ page }) => {
  await page.setContent(`
    <div data-testid="comment-card-42" class="btn btn-primary">Protected</div>
  `);

  const mutator = new WebMutator();
  const record = await mutator.applyMutation(page, '[data-testid="comment-card-42"]', new ToggleCssClass());

  expect(record.success).toBe(false);
  expect(record.error).toContain('oracle-protected');
  await expect(page.getByTestId('comment-card-42')).toHaveClass(/btn-primary/);
});

test('mutator skips structural ancestors that contain oracle roots', async ({ page }) => {
  await page.setContent(`
    <div id="comment-list">
      <div data-testid="comment-card-42">Protected child</div>
    </div>
  `);

  const mutator = new WebMutator();
  const record = await mutator.applyMutation(page, '#comment-list', new SubtreeDelete());

  expect(record.success).toBe(false);
  expect(record.error).toContain('oracle-protected');
  await expect(page.getByTestId('comment-card-42')).toBeVisible();
});
