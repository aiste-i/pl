import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('corpus report exposes an explicit migration matrix without temporary debt wording', async () => {
  const reportPath = path.join(process.cwd(), 'reports', 'realworld-benchmark-corpus.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    sourceSpecMatrix: Array<{ status: string; rationale: string }>;
    policy: { temporaryMigrationDebtRemaining: boolean };
  };

  expect(report.policy.temporaryMigrationDebtRemaining).toBe(false);
  expect(report.sourceSpecMatrix.length).toBeGreaterThan(0);
  expect(report.sourceSpecMatrix.every(row => ['migrated', 'excluded-by-design', 'excluded-methodological'].includes(row.status))).toBe(true);
});

test('operator taxonomy and coverage reports are machine-readable', async () => {
  const taxonomyPath = path.join(process.cwd(), 'reports', 'realworld-operator-taxonomy.json');
  const coveragePath = path.join(process.cwd(), 'reports', 'realworld-operator-coverage.json');
  const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8')) as Array<{
    operator: string;
    benchmarkScope: string;
    thesisCategory: string;
    domConditions: string;
    safetyGuard: string;
  }>;
  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8')) as Array<{
    appId: string;
    operators: Array<{ operator: string; selectedCandidateCount: number; sampleTargetSelectors: string[] }>;
  }>;

  expect(taxonomy.some(row => row.operator === 'ToggleAriaExpanded' && row.benchmarkScope === 'in-scope')).toBe(true);
  expect(taxonomy.some(row => row.operator === 'MaskMutator' && row.benchmarkScope === 'excluded-by-design')).toBe(true);
  expect(taxonomy.every(row => typeof row.domConditions === 'string' && row.domConditions.length > 0)).toBe(true);
  expect(taxonomy.every(row => typeof row.safetyGuard === 'string' && row.safetyGuard.length > 0)).toBe(true);
  expect(coverage.length).toBeGreaterThan(0);
  expect(coverage.every(row => row.operators.length > 0)).toBe(true);
});

test('pipeline verification report distinguishes primary and supplementary environments', async () => {
  const reportPath = path.join(process.cwd(), 'reports', 'realworld-pipeline-verification.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    primaryEnvironment: { browser: string };
    supplementaryEnvironment: { browsers: string[] };
    workflows: Array<{ present: boolean }>;
  };

  expect(report.primaryEnvironment.browser).toBe('chromium');
  expect(report.supplementaryEnvironment.browsers).toEqual(['firefox', 'webkit']);
  expect(report.workflows.every(workflow => workflow.present)).toBe(true);
});

test('tracked accessibility summary reports exist for reviewers', async () => {
  const completedOnlyPath = path.join(process.cwd(), 'reports', 'realworld-accessibility-summary-completed-only.csv');
  const allValidRunsPath = path.join(process.cwd(), 'reports', 'realworld-accessibility-summary-all-valid-runs.csv');
  const scanStatusPath = path.join(process.cwd(), 'reports', 'realworld-accessibility-scan-status-summary.csv');

  const completedOnly = fs.readFileSync(completedOnlyPath, 'utf8');
  const allValidRuns = fs.readFileSync(allValidRunsPath, 'utf8');
  const scanStatus = fs.readFileSync(scanStatusPath, 'utf8');

  expect(completedOnly).toContain('appId,corpusId,family');
  expect(allValidRuns).toContain('appId,corpusId,family');
  expect(scanStatus).toContain('appId,corpusId,family');
});
