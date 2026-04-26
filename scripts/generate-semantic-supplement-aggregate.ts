import fs from 'fs';
import path from 'path';
import {
  REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID,
  REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST,
} from '../src/benchmark/realworld-corpus';
import { aggregate, loadResults } from '../src/benchmark/runner/aggregate';

type CoverageStatus = 'mutated-covered' | 'baseline-supported-no-valid-mutated-candidate';

interface ScenarioCoverageRow {
  scenarioId: string;
  status: CoverageStatus;
  selectedCandidateId: string | null;
  reason: string | null;
}

interface ScenarioFilePayload {
  metadata?: {
    applicationId?: string;
    corpusId?: string;
    seed?: number;
    budget?: number;
    semanticScenarioCoverage?: ScenarioCoverageRow[];
  };
}

interface GenerateOptions {
  resultsRoot?: string;
  outputDir?: string;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function expectedSupplementApps(): string[] {
  return Array.from(new Set(
    REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST.scenarios.flatMap(scenario => scenario.supportedApps),
  )).sort();
}

function supportedScenarioIdsForApp(appId: string): string[] {
  return REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST.scenarios
    .filter(scenario => scenario.supportedApps.includes(appId as any))
    .map(scenario => scenario.scenarioId)
    .sort();
}

function failIfAny(errors: string[]): void {
  if (errors.length > 0) {
    throw new Error([
      'Cannot generate thesis-facing semantic supplement aggregate because required supplement evidence is incomplete or polluted.',
      ...errors.map(error => `- ${error}`),
    ].join('\n'));
  }
}

export function generateSemanticSupplementAggregate(options: GenerateOptions = {}): string {
  const resultsRoot = options.resultsRoot ?? path.join(process.cwd(), 'test-results');
  const outputDir = options.outputDir ?? path.join(
    resultsRoot,
    REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID,
    'combined-aggregate',
  );
  const expectedApps = expectedSupplementApps();
  const validSupplementScenarioIds = new Set(REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST.scenarios.map(scenario => scenario.scenarioId));
  const errors: string[] = [];
  const inputDirs: string[] = [];
  const scenarioPayloadsByApp = new Map<string, ScenarioFilePayload>();

  for (const appId of expectedApps) {
    const appRoot = path.join(resultsRoot, appId, REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID);
    const inputDir = path.join(appRoot, 'benchmark-runs');
    const scenarioPath = path.join(appRoot, 'scenarios.json');
    const requiredScenarioIds = supportedScenarioIdsForApp(appId);

    if (!fs.existsSync(inputDir)) {
      errors.push(`${appId} is missing supplement benchmark runs at ${inputDir}`);
    } else {
      inputDirs.push(inputDir);
    }

    if (!fs.existsSync(scenarioPath)) {
      errors.push(`${appId} is missing supplement scenarios metadata at ${scenarioPath}`);
      continue;
    }

    const payload = readJson<ScenarioFilePayload>(scenarioPath);
    scenarioPayloadsByApp.set(appId, payload);
    if (payload.metadata?.corpusId !== REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID) {
      errors.push(`${appId} scenarios.json has corpusId ${payload.metadata?.corpusId ?? 'missing'}, expected ${REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID}`);
    }

    const coverageRows = payload.metadata?.semanticScenarioCoverage;
    if (!Array.isArray(coverageRows) || coverageRows.length === 0) {
      errors.push(`${appId} scenarios.json is missing metadata.semanticScenarioCoverage`);
      continue;
    }

    const coverageByScenario = new Map(coverageRows.map(row => [row.scenarioId, row]));
    for (const scenarioId of requiredScenarioIds) {
      const row = coverageByScenario.get(scenarioId);
      if (!row) {
        errors.push(`${appId} is missing semanticScenarioCoverage for supported scenario ${scenarioId}`);
        continue;
      }
      if (row.status !== 'mutated-covered' && row.status !== 'baseline-supported-no-valid-mutated-candidate') {
        errors.push(`${appId} scenario ${scenarioId} has invalid supplement coverage status ${String(row.status)}`);
      }
      if (row.status === 'mutated-covered' && !row.selectedCandidateId) {
        errors.push(`${appId} scenario ${scenarioId} is mutated-covered but has no selectedCandidateId`);
      }
      if (row.status === 'baseline-supported-no-valid-mutated-candidate' && !row.reason) {
        errors.push(`${appId} scenario ${scenarioId} has no valid mutation candidate but no explicit reason`);
      }
    }

    for (const row of coverageRows) {
      if (!requiredScenarioIds.includes(row.scenarioId)) {
        errors.push(`${appId} scenarios.json contains coverage for unsupported or non-supplement scenario ${row.scenarioId}`);
      }
    }
  }

  failIfAny(errors);

  const runs = inputDirs.flatMap(inputDir => loadResults(inputDir));
  const loadedApps = new Set(runs.map(run => run.applicationId));

  for (const appId of expectedApps) {
    if (!loadedApps.has(appId)) {
      errors.push(`${appId} has no loaded benchmark result rows`);
    }
  }

  for (const run of runs) {
    if (run.corpusId !== REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID) {
      errors.push(`${run.applicationId} ${run.activeScenarioId} ${run.locatorFamily} includes non-supplement corpus ${run.corpusId}`);
    }
    if (!validSupplementScenarioIds.has(run.activeScenarioId)) {
      errors.push(`${run.applicationId} includes non-supplement scenario ${run.activeScenarioId}`);
    }
    if (!expectedApps.includes(run.applicationId)) {
      errors.push(`Unexpected app ${run.applicationId} appears in supplement benchmark runs`);
    }
  }

  const semanticFirstRows = runs.filter(run => run.locatorFamily === 'semantic-first');
  const eligibleMutatedSemanticRows = semanticFirstRows.filter(run => run.phase === 'mutated' && run.comparisonEligible);

  for (const appId of expectedApps) {
    const coverageRows = scenarioPayloadsByApp.get(appId)?.metadata?.semanticScenarioCoverage ?? [];
    const coverageByScenario = new Map(coverageRows.map(row => [row.scenarioId, row]));

    for (const scenarioId of supportedScenarioIdsForApp(appId)) {
      const baselineRows = semanticFirstRows.filter(run =>
        run.applicationId === appId &&
        run.activeScenarioId === scenarioId &&
        run.phase === 'baseline' &&
        run.runStatus === 'passed',
      );
      const mutatedRows = eligibleMutatedSemanticRows.filter(run =>
        run.applicationId === appId &&
        run.activeScenarioId === scenarioId,
      );
      const coverage = coverageByScenario.get(scenarioId);

      if (baselineRows.length === 0) {
        errors.push(`${appId} ${scenarioId} has no passed semantic-first baseline row`);
      }

      if (coverage?.status === 'mutated-covered' && mutatedRows.length === 0) {
        errors.push(`${appId} ${scenarioId} is marked mutated-covered but has no comparison-eligible mutated semantic-first row`);
      }

      if (coverage?.status === 'baseline-supported-no-valid-mutated-candidate' && mutatedRows.length > 0) {
        errors.push(`${appId} ${scenarioId} is marked no-valid-mutated-candidate but has comparison-eligible mutated semantic-first evidence`);
      }
    }
  }

  if (runs.length === 0) {
    errors.push(`No ${REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID} runs found in: ${inputDirs.join(', ')}`);
  }

  failIfAny(errors);

  aggregate(runs, outputDir, {
    supplementResultsRoot: resultsRoot,
    supplementExpectedApps: expectedApps,
  });
  console.log(`Combined semantic supplement aggregate written to ${outputDir}`);
  return outputDir;
}

function main() {
  generateSemanticSupplementAggregate();
}

if (require.main === module) {
  main();
}
