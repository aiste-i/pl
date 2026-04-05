import fs from 'fs';
import path from 'path';
import { REALWORLD_APP_IDS } from '../src/apps';
import { getOperatorCatalog } from '../src/webmutator/operators/catalog';

interface ReachableTargetsFile {
  metadata?: {
    operatorCoverage?: Array<{
      operator: string;
      runtimeCategory: string;
      thesisCategory: string;
      candidateCount: number;
      applicableCount: number;
      skippedOracleCount: number;
      notApplicableCount: number;
      totalCheckDurationMs: number;
    }>;
  };
  targets?: Array<{
    eligibleOperators?: string[];
    oracleProtected?: boolean;
  }>;
}

function safeReadJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function loadMutatedRuns(dirPath: string): any[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter(fileName => fileName.endsWith('.json'))
    .map(fileName => safeReadJson<any>(path.join(dirPath, fileName)))
    .filter((record): record is any => Boolean(record))
    .filter(record => record.phase === 'mutated');
}

function main() {
  const reportsDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const catalog = getOperatorCatalog().map(entry => ({
    operator: entry.type,
    implementationKind: entry.implementationKind,
    benchmarkScope: entry.benchmarkScope,
    runtimeCategory: entry.runtimeCategory,
    thesisCategory: entry.thesisCategory,
    excludedReason: entry.excludedReason ?? null,
  }));

  const coverageReport = REALWORLD_APP_IDS.map(appId => {
    const appDir = path.join(process.cwd(), 'test-results', appId, 'realworld-active');
    const reachableTargets = safeReadJson<ReachableTargetsFile>(path.join(appDir, 'reachable-targets.json'));
    const scenarios = safeReadJson<{ scenarios?: Array<{ operator?: { type?: string } }> }>(path.join(appDir, 'scenarios.json'));
    const mutatedRuns = loadMutatedRuns(path.join(appDir, 'benchmark-runs'));

    const selectedCounts = new Map<string, number>();
    for (const scenario of scenarios?.scenarios ?? []) {
      const operator = scenario.operator?.type;
      if (!operator) {
        continue;
      }
      selectedCounts.set(operator, (selectedCounts.get(operator) ?? 0) + 1);
    }

    const appliedCounts = new Map<string, number>();
    const outcomeCounts = new Map<string, Record<string, number>>();
    for (const run of mutatedRuns) {
      const operator = run.changeOperator;
      if (!operator) {
        continue;
      }
      appliedCounts.set(operator, (appliedCounts.get(operator) ?? 0) + 1);
      const bucket = outcomeCounts.get(operator) ?? {};
      const outcome = run.mutationTelemetry?.finalMutationOutcomeClass ?? 'unknown';
      bucket[outcome] = (bucket[outcome] ?? 0) + 1;
      outcomeCounts.set(operator, bucket);
    }

    const operatorCoverage = new Map(
      (reachableTargets?.metadata?.operatorCoverage ?? []).map(row => [row.operator, row]),
    );

    return {
      appId,
      corpusId: 'realworld-active',
      operators: catalog.map(entry => ({
        operator: entry.operator,
        benchmarkScope: entry.benchmarkScope,
        runtimeCategory: entry.runtimeCategory,
        thesisCategory: entry.thesisCategory,
        excludedReason: entry.excludedReason,
        candidateCount: operatorCoverage.get(entry.operator)?.candidateCount ?? 0,
        applicableCount: operatorCoverage.get(entry.operator)?.applicableCount ?? 0,
        skippedOracleCount: operatorCoverage.get(entry.operator)?.skippedOracleCount ?? 0,
        notApplicableCount: operatorCoverage.get(entry.operator)?.notApplicableCount ?? 0,
        totalCheckDurationMs: operatorCoverage.get(entry.operator)?.totalCheckDurationMs ?? 0,
        selectedMutationCount: selectedCounts.get(entry.operator) ?? 0,
        appliedMutationCount: appliedCounts.get(entry.operator) ?? 0,
        finalOutcomeClasses: outcomeCounts.get(entry.operator) ?? {},
      })),
    };
  });

  fs.writeFileSync(
    path.join(reportsDir, 'realworld-operator-taxonomy.json'),
    JSON.stringify(catalog, null, 2),
  );
  fs.writeFileSync(
    path.join(reportsDir, 'realworld-operator-coverage.json'),
    JSON.stringify(coverageReport, null, 2),
  );
}

main();
