import * as fs from 'fs';
import { MutantGenerator } from './MutantGenerator';
import {
  getAppPreflightPoolPath,
  getAppPreflightResultsPath,
  getAppScenariosPath,
  getSelectedAppId,
} from '../../apps';

interface PreflightResultRow {
  candidateId: string;
  scenarioId: string;
  viewContext: string;
  operator: string;
  selector: string;
  success: boolean;
  reason: string | null;
  durationMs: number;
}

interface PreflightResultPayload {
  metadata: {
    applicationId: string;
    generatedAt: string;
    budget: number;
    seed: number;
    totalCandidates: number;
    successfulCandidates: number;
  };
  results: PreflightResultRow[];
}

async function main() {
  const appName = (process.argv[2] || process.env.APP_ID || process.env.npm_config_appid || getSelectedAppId()) as any;
  const budget = parseInt(process.argv[3] || process.env.BENCHMARK_BUDGET || process.env.npm_config_budget || '20', 10);
  const seed = parseInt(process.argv[4] || process.env.BENCHMARK_SEED || process.env.npm_config_seed || '12345', 10);

  const generator = new MutantGenerator(null as any, appName);
  const poolPath = getAppPreflightPoolPath(appName);
  const resultPath = getAppPreflightResultsPath(appName);
  const outputPath = getAppScenariosPath(appName);

  if (!fs.existsSync(poolPath)) {
    throw new Error(`Preflight pool does not exist: ${poolPath}`);
  }

  if (!fs.existsSync(resultPath)) {
    throw new Error(`Preflight results do not exist: ${resultPath}`);
  }

  const pool = generator.loadScenarios(poolPath);
  const payload = JSON.parse(fs.readFileSync(resultPath, 'utf8')) as PreflightResultPayload;
  const successfulCandidateIds = new Set(
    payload.results.filter(result => result.success).map(result => result.candidateId),
  );
  const validatedCandidates = pool.filter(candidate => candidate.candidateId && successfulCandidateIds.has(candidate.candidateId));
  const selected = generator.sampleScenarios(validatedCandidates, budget, seed);

  if (selected.length < budget) {
    const availableByOperator = payload.results.reduce((acc, result) => {
      acc[result.operator] = (acc[result.operator] || 0) + (result.success ? 1 : 0);
      return acc;
    }, {} as Record<string, number>);
    throw new Error(
      `Only ${selected.length} validated mutation candidates are available for ${appName}; requested budget ${budget}. ` +
      `Successful preflight candidates by operator: ${JSON.stringify(availableByOperator)}`,
    );
  }

  generator.saveScenarios(outputPath, selected);
  console.log(`Saved ${selected.length} validated scenarios to ${outputPath}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
