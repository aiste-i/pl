import { createHash } from 'crypto';
import type { MutationCandidate } from '../../webmutator/MutationCandidate';
import type { DomOperator } from '../../webmutator/operators/dom/DomOperator';
import { countFamilyStressHints } from '../../benchmark/realworld-touchpoints';

export const CATEGORY_ORDER: Array<DomOperator['category']> = [
  'structural',
  'content',
  'accessibility-semantic',
  'visibility',
];

export interface SamplingSummary {
  categoryQuotas: Record<string, number>;
  selectedCounts: Record<string, number>;
  availableCountsByCategory: Record<string, number>;
  mandatoryCoverageSatisfied: boolean;
}

export function getCandidateCategory(candidate: MutationCandidate): DomOperator['category'] {
  const runtimeCategory = candidate.operatorRuntimeCategory;
  if (
    runtimeCategory === 'structural' ||
    runtimeCategory === 'content' ||
    runtimeCategory === 'accessibility-semantic' ||
    runtimeCategory === 'visibility'
  ) {
    return runtimeCategory;
  }

  const quotaBucket = candidate.quotaBucket;
  if (
    quotaBucket === 'structural' ||
    quotaBucket === 'content' ||
    quotaBucket === 'accessibility-semantic' ||
    quotaBucket === 'visibility'
  ) {
    return quotaBucket;
  }

  return candidate.operator.category;
}

function deterministicRank(seed: number, value: string): string {
  return createHash('sha1').update(`${seed}::${value}`).digest('hex');
}

export function getEligibleCandidates(candidates: MutationCandidate[]): MutationCandidate[] {
  return candidates.filter(candidate => candidate.eligible !== false && candidate.aggregateComparisonEligible !== false);
}

export function computeCategoryQuotas(budget: number): Record<string, number> {
  const baseQuota = Math.floor(budget / CATEGORY_ORDER.length);
  const remainder = budget % CATEGORY_ORDER.length;

  return Object.fromEntries(
    CATEGORY_ORDER.map((category, index) => [category, baseQuota + (index < remainder ? 1 : 0)]),
  ) as Record<string, number>;
}

function getAvailableCountsByCategory(candidates: MutationCandidate[]): Record<string, number> {
  return Object.fromEntries(
    CATEGORY_ORDER.map(category => [
      category,
      candidates.filter(candidate => getCandidateCategory(candidate) === category).length,
    ]),
  ) as Record<string, number>;
}

function rankCandidateBase(seed: number, candidate: MutationCandidate): [number, number, string] {
  return [
    candidate.relevanceScore ?? 0,
    countFamilyStressHints(candidate.familyStressHints),
    deterministicRank(seed, candidate.candidateId || candidate.selector),
  ];
}

function compareBaseRanking(seed: number, left: MutationCandidate, right: MutationCandidate): number {
  const [leftRelevance, leftStress, leftHash] = rankCandidateBase(seed, left);
  const [rightRelevance, rightStress, rightHash] = rankCandidateBase(seed, right);

  return (
    rightRelevance - leftRelevance ||
    rightStress - leftStress ||
    leftHash.localeCompare(rightHash)
  );
}

function candidateSelectionComparator(
  seed: number,
  selectedScenarioCounts: Map<string, number>,
  selectedOperatorCounts: Map<string, number>,
) {
  return (left: MutationCandidate, right: MutationCandidate): number => {
    const base = compareBaseRanking(seed, left, right);
    if (base !== 0) {
      return base;
    }

    const leftScenarioCount = selectedScenarioCounts.get(left.scenarioId || '') ?? 0;
    const rightScenarioCount = selectedScenarioCounts.get(right.scenarioId || '') ?? 0;
    if (leftScenarioCount !== rightScenarioCount) {
      return leftScenarioCount - rightScenarioCount;
    }

    const leftOperatorCount = selectedOperatorCounts.get(left.operator.constructor.name) ?? 0;
    const rightOperatorCount = selectedOperatorCounts.get(right.operator.constructor.name) ?? 0;
    if (leftOperatorCount !== rightOperatorCount) {
      return leftOperatorCount - rightOperatorCount;
    }

    return deterministicRank(seed, left.candidateId || left.selector).localeCompare(
      deterministicRank(seed, right.candidateId || right.selector),
    );
  };
}

export function buildCategoryPools(candidates: MutationCandidate[], seed: number): Map<DomOperator['category'], MutationCandidate[]> {
  const eligibleCandidates = getEligibleCandidates(candidates);
  const pools = new Map<DomOperator['category'], MutationCandidate[]>();

  for (const category of CATEGORY_ORDER) {
    pools.set(
      category,
      eligibleCandidates
        .filter(candidate => getCandidateCategory(candidate) === category)
        .sort((left, right) => compareBaseRanking(seed, left, right)),
    );
  }

  return pools;
}

function markSelection(candidate: MutationCandidate, seed: number, selectedForCategoryMinimum: boolean): MutationCandidate {
  candidate.selectionSeed = seed;
  candidate.quotaBucket = getCandidateCategory(candidate);
  candidate.selectedForCategoryMinimum = selectedForCategoryMinimum;
  return candidate;
}

function pickCandidateFromPool(
  pool: MutationCandidate[],
  used: Set<string>,
  seed: number,
  selectedScenarioCounts: Map<string, number>,
  selectedOperatorCounts: Map<string, number>,
  preferAvailabilityHint: boolean,
): MutationCandidate | null {
  const availablePool = pool.filter(candidate => !used.has(candidate.candidateId || candidate.selector));
  if (availablePool.length === 0) {
    return null;
  }

  const preferredPool = preferAvailabilityHint
    ? availablePool.filter(candidate => candidate.categoryAvailabilityHint !== false)
    : availablePool;

  const selectionPool = preferredPool.length > 0 ? preferredPool : availablePool;
  selectionPool.sort(candidateSelectionComparator(seed, selectedScenarioCounts, selectedOperatorCounts));
  return selectionPool[0] ?? null;
}

function registerSelection(
  candidate: MutationCandidate,
  selectedScenarioCounts: Map<string, number>,
  selectedOperatorCounts: Map<string, number>,
  used: Set<string>,
) {
  used.add(candidate.candidateId || candidate.selector);
  selectedScenarioCounts.set(candidate.scenarioId || '', (selectedScenarioCounts.get(candidate.scenarioId || '') ?? 0) + 1);
  selectedOperatorCounts.set(candidate.operator.constructor.name, (selectedOperatorCounts.get(candidate.operator.constructor.name) ?? 0) + 1);
}

export function sampleMutationCandidates(
  candidates: MutationCandidate[],
  budget: number,
  seed: number,
): { selected: MutationCandidate[]; summary: SamplingSummary } {
  const pools = buildCategoryPools(candidates, seed);
  const categoryQuotas = computeCategoryQuotas(budget);
  const availableCountsByCategory = getAvailableCountsByCategory(getEligibleCandidates(candidates));
  const selected: MutationCandidate[] = [];
  const selectedCounts = Object.fromEntries(CATEGORY_ORDER.map(category => [category, 0])) as Record<string, number>;
  const requireMandatoryCoverage = budget >= CATEGORY_ORDER.length;
  const selectedScenarioCounts = new Map<string, number>();
  const selectedOperatorCounts = new Map<string, number>();
  const used = new Set<string>();

  if (requireMandatoryCoverage) {
    for (const category of CATEGORY_ORDER) {
      const candidate = pickCandidateFromPool(
        pools.get(category) ?? [],
        used,
        seed,
        selectedScenarioCounts,
        selectedOperatorCounts,
        true,
      );
      if (!candidate) {
        continue;
      }
      selected.push(markSelection(candidate, seed, true));
      selectedCounts[category] += 1;
      registerSelection(candidate, selectedScenarioCounts, selectedOperatorCounts, used);
    }
  }

  for (const category of CATEGORY_ORDER) {
    const quota = categoryQuotas[category];
    while (selectedCounts[category] < quota && selected.length < budget) {
      const candidate = pickCandidateFromPool(
        pools.get(category) ?? [],
        used,
        seed,
        selectedScenarioCounts,
        selectedOperatorCounts,
        selectedCounts[category] === 0,
      );
      if (!candidate) {
        break;
      }
      selected.push(markSelection(candidate, seed, false));
      selectedCounts[category] += 1;
      registerSelection(candidate, selectedScenarioCounts, selectedOperatorCounts, used);
    }
  }

  while (selected.length < budget) {
    const remaining = getEligibleCandidates(candidates).filter(candidate => !used.has(candidate.candidateId || candidate.selector));
    if (remaining.length === 0) {
      break;
    }
    remaining.sort(candidateSelectionComparator(seed, selectedScenarioCounts, selectedOperatorCounts));
    const candidate = remaining[0];
    selected.push(markSelection(candidate, seed, false));
    selectedCounts[getCandidateCategory(candidate)] += 1;
    registerSelection(candidate, selectedScenarioCounts, selectedOperatorCounts, used);
  }

  const mandatoryCoverageSatisfied = !requireMandatoryCoverage || CATEGORY_ORDER.every(category => selectedCounts[category] > 0);

  return {
    selected: selected.slice(0, budget),
    summary: {
      categoryQuotas,
      selectedCounts,
      availableCountsByCategory,
      mandatoryCoverageSatisfied,
    },
  };
}

export function buildMutationPreflightPool(
  candidates: MutationCandidate[],
  budget: number,
  seed: number,
  oversampleFactor = 3,
): MutationCandidate[] {
  const pools = buildCategoryPools(candidates, seed);
  const categoryQuotas = computeCategoryQuotas(budget);
  const selected = new Map<string, MutationCandidate>();

  for (const category of CATEGORY_ORDER) {
    const pool = pools.get(category) ?? [];
    const preferredPool = pool.filter(candidate => candidate.categoryAvailabilityHint !== false);
    const effectivePool = preferredPool.length > 0 ? preferredPool : pool;
    const targetCount = Math.min(effectivePool.length, Math.max(1, categoryQuotas[category] * oversampleFactor));
    for (const candidate of effectivePool.slice(0, targetCount)) {
      if (candidate.candidateId) {
        selected.set(candidate.candidateId, candidate);
      }
    }
  }

  return CATEGORY_ORDER.flatMap(category =>
    (pools.get(category) ?? []).filter(candidate => candidate.candidateId && selected.has(candidate.candidateId)),
  );
}
