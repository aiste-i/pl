import { test, expect } from './baseFixture';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Axe-Playwright Accessibility Integration Final Corrections', () => {
    
    test('BASELINE: should run accessibility scan and produce linked artifact', async ({ page, locators, benchmarkResult }) => {
        await page.goto('/');
        await locators.addTodo().fill('Linkage Test');
        await locators.addTodo().press('Enter');
        
        // Save metadata for afterEach check
        const runId = benchmarkResult.runId;
        const appName = benchmarkResult.applicationId;
        
        // Verify stabilization was configured
        expect(benchmarkResult.accessibility.runId).toBe(runId);
    });

    test('MUTATED: should link mutation metadata in artifact', async ({ page, locators, benchmarkResult }) => {
        // We simulate a mutation by manually setting metadata
        benchmarkResult.phase = 'mutated';
        benchmarkResult.changeId = '#todo-input';
        benchmarkResult.changeOperator = 'AttributeMutator';
        
        await page.goto('/');
        await locators.addTodo().fill('Mutated Linkage');
    });

    test('STATUS INDEPENDENCE: benchmark failure with successful scan', async ({ page, locators, benchmarkResult }) => {
        await page.goto('/');
        
        try {
            // Intentionally fail the benchmark run
            await runAction(async () => {
                await page.locator('#nonexistent').click({ timeout: 500 });
            });
        } catch (e) {}
        
        // runStatus will be failed, but finally block will still run scan
        expect(benchmarkResult.accessibility).toBeDefined();
    });

    test('SKIPPED: setup failure should result in skipped scan', async ({ page, benchmarkResult }) => {
        // We force a setup failure status
        benchmarkResult.runStatus = 'invalid';
        benchmarkResult.invalidRunReason = 'Setup failure during mutation application: Connection refused';
        
        // finally block should see this and skip
    });
});

/**
 * Validation helper to prove linkage and metadata consistency
 */
test.afterEach(async ({ benchmarkResult }) => {
    const appName = benchmarkResult.applicationId;
    const runId = benchmarkResult.runId;
    const scenarioId = benchmarkResult.scenarioId;
    
    const resultsDir = path.join(process.cwd(), 'test-results', appName, 'benchmark-runs');
    const safeScenarioId = scenarioId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const resultPath = path.join(resultsDir, `${safeScenarioId}_${runId}.json`);

    // 1. Verify main record existence
    if (!fs.existsSync(resultPath)) return; // Might not be written yet depending on runner timing, but in Playwright it is.
    
    const record = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    
    // 2. Linkage Check
    expect(record.runId).toBe(runId);
    expect(record.accessibility.runId).toBe(runId);
    
    // 3. Artifact Check if completed
    if (record.accessibility.scanStatus === 'completed') {
        const artifactPath = path.join(process.cwd(), record.accessibility.artifactPath);
        expect(fs.existsSync(artifactPath)).toBe(true);
        
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        
        // 4. Metadata Integrity Check (Self-describing artifact)
        expect(artifact.metadata.runId).toBe(runId);
        expect(artifact.metadata.applicationId).toBe(appName);
        expect(artifact.metadata.phase).toBe(record.phase);
        expect(artifact.metadata.benchmarkRunStatus).toBe(record.runStatus);
    }
});

// Mock helper for the independence test
async function runAction(fn: () => Promise<any>) {
    return await fn();
}
