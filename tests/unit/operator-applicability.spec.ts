import { test, expect } from '@playwright/test';
import { getBenchmarkOperatorCatalog } from '../../src/webmutator/operators/catalog';
import { evaluateMutationApplicability } from '../../src/webmutator/operators/applicability';
import { WebMutator } from '../../src/webmutator/WebMutator';
import { SubtreeDelete } from '../../src/webmutator/operators/dom/SubtreeDelete';
import { TextReplace } from '../../src/webmutator/operators/dom/TextReplace';
import { StyleVisibility } from '../../src/webmutator/operators/dom/StyleVisibility';
import { ChangeAriaLabel } from '../../src/webmutator/operators/dom/accessibility/ChangeAriaLabel';

test('each in-scope operator exposes an explicit applicability check', () => {
  for (const entry of getBenchmarkOperatorCatalog()) {
    const operator = entry.factory();
    expect(typeof operator.isApplicable, entry.type).toBe('function');
  }
});

test('structural applicability accepts safe containers and rejects interactive targets deterministically', async ({ page }) => {
  await page.setContent(`
    <div id="safe"><p>Alpha</p><p>Beta</p></div>
    <div id="unsafe"><button>Save</button></div>
  `);

  const operator = new SubtreeDelete();
  const positive = await evaluateMutationApplicability(page, page.locator('#safe'), operator);
  const negative = await evaluateMutationApplicability(page, page.locator('#unsafe'), operator);

  expect(positive).toEqual({ applicable: true, reason: null });
  expect(negative).toEqual({ applicable: false, reason: 'behavior-preservation-gate-failed' });
});

test('content applicability accepts non-empty text and rejects empty text deterministically', async ({ page }) => {
  await page.setContent(`
    <p id="copy">Readable content</p>
    <p id="empty">   </p>
  `);

  const operator = new TextReplace('mutated');

  expect(await evaluateMutationApplicability(page, page.locator('#copy'), operator)).toEqual({
    applicable: true,
    reason: null,
  });
  expect(await evaluateMutationApplicability(page, page.locator('#empty'), operator)).toEqual({
    applicable: false,
    reason: 'behavior-preservation-gate-failed',
  });
});

test('accessibility-semantic applicability accepts matching ARIA targets and rejects non-matching targets', async ({ page }) => {
  await page.setContent(`
    <button id="labelled" aria-label="Open menu">Menu</button>
    <button id="plain">Plain</button>
  `);

  const operator = new ChangeAriaLabel();

  expect(await evaluateMutationApplicability(page, page.locator('#labelled'), operator)).toEqual({
    applicable: true,
    reason: null,
  });
  expect(await evaluateMutationApplicability(page, page.locator('#plain'), operator)).toEqual({
    applicable: false,
    reason: 'behavior-preservation-gate-failed',
  });
});

test('visibility applicability accepts safe presentation nodes and rejects controls', async ({ page }) => {
  await page.setContent(`
    <div id="copy">Presentation copy</div>
    <button id="control">Submit</button>
  `);

  const operator = new StyleVisibility();

  expect(await evaluateMutationApplicability(page, page.locator('#copy'), operator)).toEqual({
    applicable: true,
    reason: null,
  });
  expect(await evaluateMutationApplicability(page, page.locator('#control'), operator)).toEqual({
    applicable: false,
    reason: 'behavior-preservation-gate-failed',
  });
});

test('oracle-protected targets are rejected with a clear reason', async ({ page }) => {
  await page.setContent('<p id="protected" data-testid="oracle-copy">Protected copy</p>');

  const result = await evaluateMutationApplicability(page, page.locator('#protected'), new TextReplace());

  expect(result).toEqual({ applicable: false, reason: 'oracle-protected' });
});

test('behavior-preservation gate failures surface as stable mutation skip reasons', async ({ page }) => {
  await page.setContent('<button id="control">Submit</button>');

  const record = await new WebMutator().applyMutation(page, '#control', new StyleVisibility());

  expect(record.success).toBe(false);
  expect(record.error).toContain('behavior-preservation-gate-failed');
});
