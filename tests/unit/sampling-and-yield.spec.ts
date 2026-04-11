import { test, expect } from '@playwright/test';
import { MutationCandidate } from '../../src/webmutator/MutationCandidate';
import { TextReplace } from '../../src/webmutator/operators/dom/TextReplace';
import { StyleVisibility } from '../../src/webmutator/operators/dom/StyleVisibility';
import { SubtreeDelete } from '../../src/webmutator/operators/dom/SubtreeDelete';
import { ChangeAriaLabel } from '../../src/webmutator/operators/dom/accessibility/ChangeAriaLabel';
import { buildMutationPreflightPool, computeCategoryQuotas, sampleMutationCandidates } from '../../src/murun/runner/sampling';
import { evaluateComparableYield } from '../../src/benchmark/comparable-yield';

function candidatePool(): MutationCandidate[] {
  const factories = [
    () => new SubtreeDelete(),
    () => new TextReplace('mutated'),
    () => new ChangeAriaLabel(),
    () => new StyleVisibility(),
  ];

  return Array.from({ length: 24 }, (_, index) => {
    const operator = factories[index % factories.length]();
    return new MutationCandidate(`#target-${index}`, operator, 'http://example.test', { tagType: 'div' }, {
      applicationId: 'angular-realworld-example-app',
      candidateId: `candidate-${index.toString().padStart(2, '0')}`,
      scenarioId: `scenario-${index % 4}`,
      viewContext: `view-${index % 2}`,
      eligible: true,
      aggregateComparisonEligible: true,
    });
  });
}

test('preflight pool oversamples each mutation category deterministically', () => {
  const candidates = candidatePool();
  const preflightPool = buildMutationPreflightPool(candidates, 10, 12345, 3);

  expect(preflightPool).toHaveLength(24);
  expect(preflightPool.map(candidate => candidate.candidateId)).toEqual(
    buildMutationPreflightPool(candidates, 10, 12345, 3).map(candidate => candidate.candidateId),
  );
});

test('final sampling rebalances across validated candidates only', () => {
  const candidates = candidatePool().filter(candidate => !['candidate-00', 'candidate-01', 'candidate-02'].includes(candidate.candidateId!));
  const sampled = sampleMutationCandidates(candidates, 8, 12345);

  expect(sampled.selected).toHaveLength(8);
  expect(sampled.summary.categoryQuotas).toEqual(computeCategoryQuotas(8));
});

test('comparable yield guard flags low-yield browser-family rows', () => {
  const failures = evaluateComparableYield([
    {
      appId: 'realworld',
      browserName: 'chromium',
      family: 'semantic-first',
      mutatedRuns: 10,
      comparableMutatedRuns: 4,
    },
    {
      appId: 'angular-realworld-example-app',
      browserName: 'chromium',
      family: 'css',
      mutatedRuns: 10,
      comparableMutatedRuns: 8,
    },
  ], 0.7);

  expect(failures).toHaveLength(1);
  expect(failures[0].row.appId).toBe('realworld');
});
