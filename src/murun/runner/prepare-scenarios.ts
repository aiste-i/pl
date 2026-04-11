import { execFileSync } from 'child_process';
import * as fs from 'fs';
import {
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

function getNpmCommand(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function runNpmScript(script: string, env: NodeJS.ProcessEnv): void {
  execFileSync(getNpmCommand(), ['run', script], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env,
  });
}

function readPreflightResults(appName: string): PreflightResultPayload {
  const resultPath = getAppPreflightResultsPath(appName as any);
  if (!fs.existsSync(resultPath)) {
    throw new Error(`Preflight results do not exist: ${resultPath}`);
  }
  return JSON.parse(fs.readFileSync(resultPath, 'utf8')) as PreflightResultPayload;
}

function summarizeSuccessfulOperators(results: PreflightResultPayload): Record<string, number> {
  return results.results.reduce((acc, result) => {
    if (result.success) {
      acc[result.operator] = (acc[result.operator] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
}

async function main() {
  const appName = (process.argv[2] || process.env.APP_ID || process.env.npm_config_appid || getSelectedAppId()) as any;
  const budget = parseInt(process.argv[3] || process.env.BENCHMARK_BUDGET || process.env.npm_config_budget || '20', 10);
  const seed = parseInt(process.argv[4] || process.env.BENCHMARK_SEED || process.env.npm_config_seed || '12345', 10);
  const preflightTimeoutMs = parseInt(process.argv[5] || process.env.PREFLIGHT_TEST_TIMEOUT_MS || '60000', 10);
  const oversampleFactors = (process.env.PREFLIGHT_OVERSAMPLE_FACTORS || '3,5,8,12,16')
    .split(',')
    .map(value => parseInt(value.trim(), 10))
    .filter(value => Number.isFinite(value) && value > 0);

  const sharedEnv = {
    ...process.env,
    APP_ID: String(appName),
    BENCHMARK_BUDGET: String(budget),
    BENCHMARK_SEED: String(seed),
    PREFLIGHT_TEST_TIMEOUT_MS: String(preflightTimeoutMs),
  };

  runNpmScript('benchmark:collect:app', sharedEnv);

  let lastError: Error | null = null;
  for (const oversampleFactor of oversampleFactors) {
    const env = {
      ...sharedEnv,
      PREFLIGHT_OVERSAMPLE_FACTOR: String(oversampleFactor),
    };

    console.log(`Preparing validated scenarios for ${appName} with preflight oversample factor ${oversampleFactor}.`);
    runNpmScript('benchmark:generate:app', env);
    runNpmScript('benchmark:preflight:app', env);

    try {
      runNpmScript('benchmark:finalize:app', env);
      const scenarioPath = getAppScenariosPath(appName as any);
      console.log(`Validated scenario preparation complete for ${appName}. Final scenario file: ${scenarioPath}`);
      return;
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const results = readPreflightResults(appName);
      const availableByOperator = summarizeSuccessfulOperators(results);
      console.warn(
        `Validated candidate count is still below budget ${budget} for ${appName} after oversample factor ${oversampleFactor}. ` +
        `Successful candidates: ${results.metadata.successfulCandidates}/${results.metadata.totalCandidates}. ` +
        `By operator: ${JSON.stringify(availableByOperator)}`,
      );
    }
  }

  throw lastError ?? new Error(`Failed to prepare validated scenarios for ${appName}.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
