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
            { runId: uuidv4(), locatorFamily: 'semantic-first', phase: 'mutated', runStatus: 'passed', durationMs: 100 },
            { runId: uuidv4(), locatorFamily: 'semantic-first', phase: 'mutated', runStatus: 'failed', failureClass: 'NO_MATCH', changeOperator: 'SubtreeDelete', durationMs: 200 },
            { runId: uuidv4(), locatorFamily: 'semantic-first', phase: 'baseline', runStatus: 'passed', durationMs: 50 },
            
            // css: 2 mutated (2 fail ACTIONABILITY), 1 baseline pass
            { runId: uuidv4(), locatorFamily: 'css', phase: 'mutated', runStatus: 'failed', failureClass: 'ACTIONABILITY', changeOperator: 'StyleVisibility', durationMs: 300 },
            { runId: uuidv4(), locatorFamily: 'css', phase: 'mutated', runStatus: 'failed', failureClass: 'ACTIONABILITY', changeOperator: 'StyleVisibility', durationMs: 400 },
            { runId: uuidv4(), locatorFamily: 'css', phase: 'baseline', runStatus: 'passed', durationMs: 60 },

            // Invalid run (should be ignored)
            { runId: uuidv4(), locatorFamily: 'xpath', phase: 'mutated', runStatus: 'invalid', invalidRunReason: 'Setup failure' }
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

        // semantic-first: 2 mutated, 1 fail -> 0.5000 rate
        expect(summaryByFamily).toContain('semantic-first,3,2,1,0.5000');
        // css: 2 mutated, 2 fail -> 1.0000 rate
        expect(summaryByFamily).toContain('css,3,2,2,1.0000');

        const failureDist = fs.readFileSync(path.join(outputDir, 'failure_distribution.csv'), 'utf8');
        // semantic-first: 1 fail (NO_MATCH) -> 1.0000 proportion
        expect(failureDist).toContain('semantic-first,NO_MATCH,1,1.0000');
        // css: 2 fail (ACTIONABILITY) -> 1.0000 proportion
        expect(failureDist).toContain('css,ACTIONABILITY,2,1.0000');
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
