import { test, expect } from '@playwright/test';
import { DomOperators } from '../../src/webmutator/operators/DomOperators';
import { OperatorRegistry } from '../../src/webmutator/operators/OperatorRegistry';

test('dom operator list includes the new RealWorld benchmark stressors', async () => {
  const operatorNames = DomOperators.getDomOperators().map(operator => operator.constructor.name);

  expect(operatorNames).toContain('ReverseChildrenOrder');
  expect(operatorNames).toContain('ChangeAriaLabel');
});

test('operator registry can recreate the newly added operators', async () => {
  expect(OperatorRegistry.createOperator('ReverseChildrenOrder').constructor.name).toBe('ReverseChildrenOrder');
  expect(OperatorRegistry.createOperator('ChangeAriaLabel').constructor.name).toBe('ChangeAriaLabel');
});
