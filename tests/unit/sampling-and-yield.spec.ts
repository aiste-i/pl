import { test, expect } from '@playwright/test';
import { MutationCandidate } from '../../src/webmutator/MutationCandidate';
import { TextReplace } from '../../src/webmutator/operators/dom/TextReplace';
import { StyleVisibility } from '../../src/webmutator/operators/dom/StyleVisibility';
import { SubtreeDelete } from '../../src/webmutator/operators/dom/SubtreeDelete';
import { ChangeAriaLabel } from '../../src/webmutator/operators/dom/accessibility/ChangeAriaLabel';
import { buildMutationPreflightPool, computeCategoryQuotas, sampleMutationCandidates } from '../../src/murun/runner/sampling';
import { evaluateComparableYield } from '../../src/benchmark/comparable-yield';
import { evaluateMutationMeaningfulness } from '../../src/benchmark/mutation-quality';

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

test('exact touchpoint candidates outrank generic candidates within the same category', () => {
  const exact = new MutationCandidate('#exact', new TextReplace('mutated'), 'http://example.test', { tagType: 'button' }, {
    candidateId: 'exact',
    scenarioId: 'scenario-a',
    eligible: true,
    aggregateComparisonEligible: true,
    relevanceBand: 'exact-touchpoint',
    relevanceScore: 650,
    categoryAvailabilityHint: true,
    touchpointLogicalKeys: ['article.favoriteButton'],
    familyStressHints: { semantic: true, css: true, xpath: true },
  });
  const generic = new MutationCandidate('#generic', new TextReplace('mutated'), 'http://example.test', { tagType: 'p' }, {
    candidateId: 'generic',
    scenarioId: 'scenario-b',
    eligible: true,
    aggregateComparisonEligible: true,
    relevanceBand: 'generic',
    relevanceScore: 0,
    categoryAvailabilityHint: false,
    familyStressHints: { semantic: false, css: false, xpath: false },
  });

  const sampled = sampleMutationCandidates([generic, exact], 1, 12345);

  expect(sampled.selected.map(candidate => candidate.candidateId)).toEqual(['exact']);
});

test('accessible-name surface candidates outrank unrelated generic accessibility-semantic candidates', () => {
  const relevant = new MutationCandidate('#button-label', new ChangeAriaLabel(), 'http://example.test', { tagType: 'button' }, {
    candidateId: 'accessible-relevant',
    scenarioId: 'scenario-a',
    eligible: true,
    aggregateComparisonEligible: true,
    relevanceBand: 'same-accessible-name-surface',
    relevanceScore: 345,
    categoryAvailabilityHint: true,
    touchpointLogicalKeys: ['comments.deleteButton'],
    familyStressHints: { semantic: true, css: true, xpath: true },
  });
  const generic = new MutationCandidate('#paragraph', new ChangeAriaLabel(), 'http://example.test', { tagType: 'div' }, {
    candidateId: 'accessible-generic',
    scenarioId: 'scenario-b',
    eligible: true,
    aggregateComparisonEligible: true,
    relevanceBand: 'generic',
    relevanceScore: 0,
    categoryAvailabilityHint: false,
    familyStressHints: { semantic: false, css: false, xpath: false },
  });

  const sampled = sampleMutationCandidates([generic, relevant], 1, 12345);

  expect(sampled.selected.map(candidate => candidate.candidateId)).toEqual(['accessible-relevant']);
});

test('budget >= 4 marks mandatory coverage unsatisfied when accessibility-semantic candidates are missing', () => {
  const candidates = candidatePool().filter(candidate => candidate.operator.category !== 'accessibility-semantic');
  const sampled = sampleMutationCandidates(candidates, 8, 12345);

  expect(sampled.summary.mandatoryCoverageSatisfied).toBe(false);
  expect(sampled.summary.selectedCounts['accessibility-semantic']).toBe(0);
});

test('budget >= 4 keeps at least one candidate from each category when available', () => {
  const sampled = sampleMutationCandidates(candidatePool(), 8, 12345);

  expect(sampled.summary.mandatoryCoverageSatisfied).toBe(true);
  expect(sampled.summary.selectedCounts['structural']).toBeGreaterThan(0);
  expect(sampled.summary.selectedCounts['content']).toBeGreaterThan(0);
  expect(sampled.summary.selectedCounts['accessibility-semantic']).toBeGreaterThan(0);
  expect(sampled.summary.selectedCounts['visibility']).toBeGreaterThan(0);
});

test('meaningfulness checks reject weak generic no-op mutations and accept relevant semantic effects', () => {
  expect(
    evaluateMutationMeaningfulness(
      'content',
      'generic',
      {
        exists: true,
        tagType: 'p',
        textContent: 'before',
        className: null,
        style: null,
        role: null,
        ariaLabel: null,
        placeholder: null,
        alt: null,
        title: null,
        hidden: false,
        childElementCount: 0,
        parentSelector: 'div > p',
      },
      {
        exists: true,
        tagType: 'p',
        textContent: 'before',
        className: null,
        style: null,
        role: null,
        ariaLabel: null,
        placeholder: null,
        alt: null,
        title: null,
        hidden: false,
        childElementCount: 0,
        parentSelector: 'div > p',
      },
    ),
  ).toEqual({
    meaningful: false,
    reason: 'relevance-too-weak',
  });

  expect(
    evaluateMutationMeaningfulness(
      'accessibility-semantic',
      'same-accessible-name-surface',
      {
        exists: true,
        tagType: 'button',
        textContent: 'Delete comment',
        className: null,
        style: null,
        role: 'button',
        ariaLabel: 'Delete comment',
        placeholder: null,
        alt: null,
        title: null,
        hidden: false,
        childElementCount: 1,
        parentSelector: 'div > button',
      },
      {
        exists: true,
        tagType: 'button',
        textContent: 'Delete comment',
        className: null,
        style: null,
        role: 'button',
        ariaLabel: 'Remove comment',
        placeholder: null,
        alt: null,
        title: null,
        hidden: false,
        childElementCount: 1,
        parentSelector: 'div > button',
      },
    ),
  ).toEqual({
    meaningful: true,
    reason: null,
  });
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
