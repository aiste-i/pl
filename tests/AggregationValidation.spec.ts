import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

test.describe('Aggregation Script Validation', () => {
    const testDataDir = path.join(process.cwd(), 'test-results', 'agg-test');
    const outputDir = path.join(process.cwd(), 'test-results', 'agg-output');

    test.beforeAll(() => {
        if (fs.existsSync(testDataDir)) fs.rmSync(testDataDir, { recursive: true });
        if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true });
        fs.mkdirSync(testDataDir, { recursive: true });
    });

    test('should correctly aggregate mock results', async () => {
        // 1. Create Mock Data
        const mockRuns = [
            // semantic-first: 2 mutated (1 pass, 1 fail NO_MATCH), 1 baseline pass
            { runId: uuidv4(), applicationId: 'angular-realworld-example-app', browserName: 'chromium', corpusId: 'realworld-active', activeScenarioId: 'health.home-load', activeScenarioCategory: 'load-visibility', sourceSpec: 'tests/realworld/health.spec.ts', locatorFamily: 'semantic-first', phase: 'mutated', runStatus: 'passed', changeOperator: 'SubtreeDelete', changeCategory: 'structural', durationMs: 100, mutationTelemetry: { operatorCandidateCount: 5, operatorApplicableCount: 2, operatorSkippedOracleCount: 1, operatorNotApplicableCount: 2, operatorCheckDurationMs: 30, applyDurationMs: 10, applyFailureCount: 0, finalMutationOutcomeClass: 'applied' } },
            { runId: uuidv4(), applicationId: 'angular-realworld-example-app', browserName: 'chromium', corpusId: 'realworld-active', activeScenarioId: 'health.home-load', activeScenarioCategory: 'load-visibility', sourceSpec: 'tests/realworld/health.spec.ts', locatorFamily: 'semantic-first', phase: 'mutated', runStatus: 'failed', failureClass: 'NO_MATCH', changeOperator: 'SubtreeDelete', changeCategory: 'structural', durationMs: 200, mutationTelemetry: { operatorCandidateCount: 5, operatorApplicableCount: 2, operatorSkippedOracleCount: 1, operatorNotApplicableCount: 2, operatorCheckDurationMs: 30, applyDurationMs: 12, applyFailureCount: 0, finalMutationOutcomeClass: 'applied' } },
            { runId: uuidv4(), applicationId: 'angular-realworld-example-app', browserName: 'chromium', corpusId: 'realworld-active', activeScenarioId: 'health.home-load', activeScenarioCategory: 'load-visibility', sourceSpec: 'tests/realworld/health.spec.ts', locatorFamily: 'semantic-first', phase: 'baseline', runStatus: 'passed', durationMs: 50 },
            
            // css: 2 mutated (2 fail ACTIONABILITY), 1 baseline pass
            { runId: uuidv4(), applicationId: 'angular-realworld-example-app', browserName: 'chromium', corpusId: 'realworld-active', activeScenarioId: 'health.home-load', activeScenarioCategory: 'load-visibility', sourceSpec: 'tests/realworld/health.spec.ts', locatorFamily: 'css', phase: 'mutated', runStatus: 'failed', failureClass: 'ACTIONABILITY', changeOperator: 'StyleVisibility', changeCategory: 'visibility-interaction-state', durationMs: 300, mutationTelemetry: { operatorCandidateCount: 4, operatorApplicableCount: 1, operatorSkippedOracleCount: 1, operatorNotApplicableCount: 2, operatorCheckDurationMs: 20, applyDurationMs: 8, applyFailureCount: 0, finalMutationOutcomeClass: 'applied' } },
            { runId: uuidv4(), applicationId: 'angular-realworld-example-app', browserName: 'chromium', corpusId: 'realworld-active', activeScenarioId: 'health.home-load', activeScenarioCategory: 'load-visibility', sourceSpec: 'tests/realworld/health.spec.ts', locatorFamily: 'css', phase: 'mutated', runStatus: 'failed', failureClass: 'ACTIONABILITY', changeOperator: 'StyleVisibility', changeCategory: 'visibility-interaction-state', durationMs: 400, mutationTelemetry: { operatorCandidateCount: 4, operatorApplicableCount: 1, operatorSkippedOracleCount: 1, operatorNotApplicableCount: 2, operatorCheckDurationMs: 20, applyDurationMs: 9, applyFailureCount: 0, finalMutationOutcomeClass: 'applied' } },
            { runId: uuidv4(), applicationId: 'angular-realworld-example-app', browserName: 'chromium', corpusId: 'realworld-active', activeScenarioId: 'health.home-load', activeScenarioCategory: 'load-visibility', sourceSpec: 'tests/realworld/health.spec.ts', locatorFamily: 'css', phase: 'baseline', runStatus: 'passed', durationMs: 60 },

            // Invalid run (should be ignored)
            { runId: uuidv4(), applicationId: 'angular-realworld-example-app', browserName: 'chromium', corpusId: 'realworld-active', activeScenarioId: 'health.home-load', activeScenarioCategory: 'load-visibility', sourceSpec: 'tests/realworld/health.spec.ts', locatorFamily: 'xpath', phase: 'mutated', runStatus: 'invalid', invalidRunReason: 'Setup failure' }
        ];

        mockRuns.forEach((run, i) => {
            fs.writeFileSync(path.join(testDataDir, `run_${i}.json`), JSON.stringify(run));
        });

        // 2. Run Aggregation
        const { execSync } = require('child_process');
        execSync(`npx ts-node src/murun/runner/aggregate.ts ${testDataDir} ${outputDir}`);

        // 3. Verify Outputs
        expect(fs.existsSync(path.join(outputDir, 'benchmark_runs.csv'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'summary_by_family.csv'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'aggregate_report.json'))).toBe(true);

        const summaryByFamily = fs.readFileSync(path.join(outputDir, 'summary_by_family.csv'), 'utf8');
        console.log('Summary by Family:\n', summaryByFamily);

        expect(summaryByFamily).toContain('semantic-first,3,2');
        expect(summaryByFamily).toContain('css,3,2');
        expect(summaryByFamily).toContain('0.5000');
        expect(summaryByFamily).toContain('1.0000');

        const failureDist = fs.readFileSync(path.join(outputDir, 'failure_distribution.csv'), 'utf8');
        // semantic-first: 1 fail (NO_MATCH) -> 1.0000 proportion
        expect(failureDist).toContain('semantic-first,NO_MATCH,1,1.0000');
        // css: 2 fail (ACTIONABILITY) -> 1.0000 proportion
        expect(failureDist).toContain('css,ACTIONABILITY,2,1.0000');

        const accessibilitySummary = fs.readFileSync(path.join(outputDir, 'accessibility_summary_all_valid_runs.csv'), 'utf8');
        expect(accessibilitySummary).toContain('semantic-first');
        expect(accessibilitySummary).toContain('css');

        const operatorTelemetry = fs.readFileSync(path.join(outputDir, 'operator_telemetry_summary.csv'), 'utf8');
        expect(operatorTelemetry).toContain('SubtreeDelete');
        expect(operatorTelemetry).toContain('StyleVisibility');
    });

    test('should fail loudly on empty input', async () => {
        const emptyDir = path.join(process.cwd(), 'test-results', 'empty-test');
        if (!fs.existsSync(emptyDir)) fs.mkdirSync(emptyDir, { recursive: true });
        
        const { execSync } = require('child_process');
        try {
            execSync(`npx ts-node src/murun/runner/aggregate.ts ${emptyDir} ${outputDir}`);
            throw new Error('Should have failed');
        } catch (e) {
            expect(e.message).toContain('No valid results found to aggregate');
        }
    });
});
