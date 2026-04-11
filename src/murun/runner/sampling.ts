import { createHash } from 'crypto';
import type { MutationCandidate } from '../../webmutator/MutationCandidate';
import type { DomOperator } from '../../webmutator/operators/dom/DomOperator';

export const CATEGORY_ORDER: Array<DomOperator['category']> = [
  'structural',
  'content',
  'accessibility-semantic',
  'visibility',
];

export interface SamplingSummary {
  categoryQuotas: Record<string, number>;
  selectedCounts: Record<string, number>;
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

export function buildCategoryPools(candidates: MutationCandidate[], seed: number): Map<DomOperator['category'], MutationCandidate[]> {
  const eligibleCandidates = getEligibleCandidates(candidates);
  const pools = new Map<DomOperator['category'], MutationCandidate[]>();

  for (const category of CATEGORY_ORDER) {
    pools.set(
      category,
      eligibleCandidates
        .filter(candidate => candidate.operator.category === category)
        .sort((left, right) =>
          deterministicRank(seed, left.candidateId || '').localeCompare(deterministicRank(seed, right.candidateId || '')),
        ),
    );
  }

  return pools;
}

export function sampleMutationCandidates(
  candidates: MutationCandidate[],
  budget: number,
  seed: number,
): { selected: MutationCandidate[]; summary: SamplingSummary } {
  const pools = buildCategoryPools(candidates, seed);
  const categoryQuotas = computeCategoryQuotas(budget);
  const selected: MutationCandidate[] = [];
  const selectedCounts = Object.fromEntries(CATEGORY_ORDER.map(category => [category, 0])) as Record<string, number>;
  let leftover = 0;

  for (const category of CATEGORY_ORDER) {
    const pool = pools.get(category)!;
    const quota = categoryQuotas[category];
    const taken = pool.slice(0, quota);
    selected.push(...taken);
    selectedCounts[category] = taken.length;
    if (taken.length < quota) {
      leftover += quota - taken.length;
    }
  }

  if (leftover > 0) {
    for (const category of CATEGORY_ORDER) {
      const pool = pools.get(category)!;
      while (leftover > 0 && selectedCounts[category] < pool.length) {
        selected.push(pool[selectedCounts[category]]);
        selectedCounts[category] += 1;
        leftover -= 1;
      }
    }
  }

  const finalSelection = selected.slice(0, budget);
  for (const candidate of finalSelection) {
    candidate.selectionSeed = seed;
    candidate.quotaBucket = candidate.operator.category;
  }

  return {
    selected: finalSelection,
    summary: {
      categoryQuotas,
      selectedCounts,
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
    const pool = pools.get(category)!;
    const targetCount = Math.min(pool.length, Math.max(1, categoryQuotas[category] * oversampleFactor));
    for (const candidate of pool.slice(0, targetCount)) {
      if (candidate.candidateId) {
        selected.set(candidate.candidateId, candidate);
      }
    }
  }

  return CATEGORY_ORDER.flatMap(category =>
    (pools.get(category) ?? []).filter(candidate => candidate.candidateId && selected.has(candidate.candidateId)),
  );
}
