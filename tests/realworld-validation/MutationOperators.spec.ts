import { test, expect } from '@playwright/test';
import { MutationRecord } from '../../src/webmutator/MutationRecord';
import { DomOperators } from '../../src/webmutator/operators/DomOperators';
import { OperatorRegistry } from '../../src/webmutator/operators/OperatorRegistry';
import { getBenchmarkOperatorCatalog, getOperatorCatalog } from '../../src/webmutator/operators/catalog';
import { SwapAdjacentSiblings } from '../../src/webmutator/operators/dom/SwapAdjacentSiblings';
import { ToggleCssClass } from '../../src/webmutator/operators/dom/ToggleCssClass';
import { ToggleAriaExpanded } from '../../src/webmutator/operators/dom/accessibility/ToggleAriaExpanded';

test('dom operator list includes the expanded RealWorld benchmark stressors', async () => {
  const operatorNames = DomOperators.getDomOperators().map(operator => operator.constructor.name);

  expect(operatorNames).toContain('ReverseChildrenOrder');
  expect(operatorNames).toContain('SwapAdjacentSiblings');
  expect(operatorNames).toContain('ChangeAriaLabel');
  expect(operatorNames).toContain('ToggleAriaExpanded');
  expect(operatorNames).toContain('ToggleCssClass');
});

test('operator catalog makes in-scope and excluded-by-design coverage explicit', async () => {
  const benchmarkOperators = getBenchmarkOperatorCatalog().map(entry => entry.type);
  const fullCatalog = getOperatorCatalog();

  expect(benchmarkOperators).toContain('ToggleAriaExpanded');
  expect(benchmarkOperators).not.toContain('DistortMutator');
  expect(benchmarkOperators).not.toContain('MaskMutator');

  const excludedVisualOperators = fullCatalog.filter(entry => entry.benchmarkScope === 'excluded-by-design');
  expect(excludedVisualOperators.map(entry => entry.type).sort()).toEqual(['DistortMutator', 'MaskMutator']);
  expect(excludedVisualOperators.every(entry => entry.excludedReason)).toBe(true);
});

test('operator registry can recreate the expanded operator set', async () => {
  expect(OperatorRegistry.createOperator('ReverseChildrenOrder').constructor.name).toBe('ReverseChildrenOrder');
  expect(OperatorRegistry.createOperator('SwapAdjacentSiblings').constructor.name).toBe('SwapAdjacentSiblings');
  expect(OperatorRegistry.createOperator('ChangeAriaLabel').constructor.name).toBe('ChangeAriaLabel');
  expect(OperatorRegistry.createOperator('ToggleAriaExpanded').constructor.name).toBe('ToggleAriaExpanded');
  expect(OperatorRegistry.createOperator('ToggleCssClass').constructor.name).toBe('ToggleCssClass');
});

test('SwapAdjacentSiblings swaps the target with its next sibling', async ({ page }) => {
  await page.setContent(`
    <div id="stack">
      <button id="first">First</button>
      <button id="second">Second</button>
      <button id="third">Third</button>
    </div>
  `);

  const operator = new SwapAdjacentSiblings();
  const target = page.locator('#first');
  const record = new MutationRecord(true);

  expect(await operator.isApplicable(page, target)).toBe(true);
  await operator.applyOperator(page, target, record);

  const order = await page.locator('#stack > *').evaluateAll(nodes =>
    nodes.map(node => (node as HTMLElement).id),
  );

  expect(order).toEqual(['second', 'first', 'third']);
  expect(record.data?.action).toBe('SwapAdjacentSiblings');
});

test('ToggleCssClass mutates regular nodes but skips oracle-protected ones', async ({ page }) => {
  await page.setContent(`
    <button id="mutate-me" class="btn btn-primary">Save</button>
    <button id="protected" data-testid="oracle-button" class="btn btn-primary">Protected</button>
  `);

  const operator = new ToggleCssClass();
  const target = page.locator('#mutate-me');
  const protectedTarget = page.locator('#protected');
  const record = new MutationRecord(true);

  expect(await operator.isApplicable(page, target)).toBe(true);
  expect(await operator.isApplicable(page, protectedTarget)).toBe(false);

  await operator.applyOperator(page, target, record);

  await expect(target).toHaveClass(/btn-outline-primary/);
  expect(record.data?.type).toBe('ToggleCssClass');
  expect(record.data?.originalClassName).toContain('btn-primary');
});

test('ToggleAriaExpanded flips aria-expanded while honoring oracle safety', async ({ page }) => {
  await page.setContent(`
    <button id="menu-toggle" aria-label="Open menu" aria-expanded="false">Menu</button>
    <button id="protected-toggle" data-testid="oracle-toggle" aria-expanded="false">Protected</button>
  `);

  const operator = new ToggleAriaExpanded();
  const target = page.locator('#menu-toggle');
  const protectedTarget = page.locator('#protected-toggle');
  const record = new MutationRecord(true);

  expect(await operator.isApplicable(page, target)).toBe(true);
  expect(await operator.isApplicable(page, protectedTarget)).toBe(false);

  await operator.applyOperator(page, target, record);

  await expect(target).toHaveAttribute('aria-expanded', 'true');
  expect(record.data).toEqual({
    type: 'ToggleAriaExpanded',
    originalValue: 'false',
    newValue: 'true',
  });
});
