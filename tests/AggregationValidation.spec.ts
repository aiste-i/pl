import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BENCHMARK_DATASET_VERSION, BENCHMARK_SCHEMA_VERSION } from '../src/benchmark/result-contract';

function makeMutationTelemetry(overrides: Record<string, unknown> = {}) {
    return {
        selectedCandidateId: null,
        selectedTargetSelector: null,
        selectedTargetTagType: null,
        operatorRuntimeCategory: null,
        operatorThesisCategory: null,
        operatorConsideredCandidateCount: null,
        operatorCandidateCount: null,
        operatorApplicableCount: null,
        operatorSkippedOracleCount: null,
        operatorNotApplicableCount: null,
        operatorSelectedCount: null,
        operatorSelectedApplicableRatio: null,
        operatorCheckDurationMs: null,
        applyDurationMs: null,
        applyFailureCount: 0,
        finalMutationOutcomeClass: null,
        ...overrides,
    };
}

function makeBenchmarkRun(overrides: Record<string, unknown> = {}) {
    const basePhase = (overrides.phase as 'baseline' | 'mutated' | undefined) ?? 'baseline';
    const baseRunStatus = (overrides.runStatus as 'passed' | 'failed' | 'invalid' | undefined) ?? 'passed';
    const runId = (overrides.runId as string | undefined) ?? uuidv4();

    const record = {
        schemaVersion: BENCHMARK_SCHEMA_VERSION,
        datasetVersion: BENCHMARK_DATASET_VERSION,
        generatedAt: '2026-04-21T00:00:00.000Z',
        commitSha: 'abc123',
        gitBranch: 'main',
        dirtyWorkingTree: false,
        nodeVersion: 'v22.21.1',
        playwrightVersion: '1.58.2',
        benchmarkPackageVersion: '1.0.0',
        platform: {
            os: 'Windows',
            platform: 'win32',
            release: '10.0.0',
            arch: 'x64',
        },
        runId,
        applicationId: 'angular-realworld-example-app',
        browserName: 'chromium',
        browserChannel: null,
        corpusId: 'realworld-active',
        scenarioId: 'health.home-load [semantic-first]',
        activeScenarioId: 'health.home-load',
        activeScenarioCategory: 'load-visibility',
        sourceSpec: 'tests/realworld/health.spec.ts',
        locatorFamily: 'semantic-first',
        semanticEntryPoint: null,
        phase: basePhase,
        mutation: {
            mutationId: basePhase === 'baseline' ? 'baseline' : 'candidate-1',
            operatorId: basePhase === 'baseline' ? 'none' : 'TextReplace',
            operatorCategory: basePhase === 'baseline' ? 'none' : 'content',
            candidateId: basePhase === 'baseline' ? null : 'candidate-1',
            seed: basePhase === 'baseline' ? null : 12345,
            phase: basePhase,
            selected: basePhase === 'mutated',
            applied: false,
            skipped: false,
            skipReason: null,
        },
        changeId: basePhase === 'baseline' ? null : 'candidate-1',
        changeCategory: basePhase === 'baseline' ? null : 'content',
        changeOperator: basePhase === 'baseline' ? null : 'TextReplace',
        quotaBucket: basePhase === 'baseline' ? null : 'content',
        comparisonEligible: true,
        comparisonExclusionReason: null,
        durationMs: 100,
        runStatus: baseRunStatus,
        failureClass: baseRunStatus === 'failed' ? 'ASSERTION' : null,
        failureStage: baseRunStatus === 'failed' ? 'ASSERTION' : null,
        rawErrorName: null,
        rawErrorMessage: null,
        classifierReason: null,
        isTimeout: false,
        isStrictnessViolation: false,
        invalidRunReason: baseRunStatus === 'invalid' ? 'setup-failure' : null,
        oracleIntegrityOk: true,
        oracleIntegrityError: null,
        evidence: {
            actionContextEntered: true,
            preActionResolutionObservation: 1,
            uniquenessViolationObserved: false,
            actionAttemptStarted: true,
            actionCompleted: baseRunStatus !== 'invalid',
            assertionStageEntered: true,
            oracleVerificationStarted: true,
            oracleVerificationCompleted: baseRunStatus !== 'invalid',
            actionabilityFailureObserved: false,
            timeoutObserved: false,
            infrastructureFailureObserved: false,
            oracleIntegrityFailureObserved: false,
        },
        instrumentationPathUsed: 'fallback',
        accessibility: {
            scanAttempted: false,
            scanStatus: 'skipped',
            scanTimestamp: null,
            scanError: null,
            detailedArtifactWritten: false,
            artifactPath: null,
            totalViolations: 0,
            violationIds: [],
            impactedNodeCount: 0,
            criticalCount: 0,
            seriousCount: 0,
            moderateCount: 0,
            minorCount: 0,
            runId,
            applicationId: 'angular-realworld-example-app',
            browserName: 'chromium',
            scenarioId: 'health.home-load [semantic-first]',
            phase: basePhase,
            stabilization: {
                attempted: false,
                status: 'skipped',
                durationMs: 0,
                strategy: 'none',
            },
        },
        tracePath: null,
        screenshotPath: null,
        axeArtifactPath: null,
        ariaSnapshotPath: null,
        metadataPath: null,
        ...overrides,
    } as any;

    record.accessibility = {
        ...record.accessibility,
        ...(overrides.accessibility as Record<string, unknown> | undefined),
        runId: record.runId,
        applicationId: record.applicationId,
        browserName: record.browserName,
        scenarioId: record.scenarioId,
        phase: record.phase,
    };

    if (record.mutationTelemetry) {
        record.mutationTelemetry = makeMutationTelemetry(record.mutationTelemetry);
    }

    if (record.phase === 'mutated') {
        record.mutation = {
            ...record.mutation,
            phase: 'mutated',
            selected: true,
            candidateId: record.changeId,
            mutationId: record.changeId,
        };
    } else {
        record.mutation = {
            ...record.mutation,
            mutationId: 'baseline',
            operatorId: 'none',
            operatorCategory: 'none',
            candidateId: null,
            seed: null,
            phase: 'baseline',
            selected: false,
            applied: false,
            skipped: false,
            skipReason: null,
        };
        record.changeId = null;
        record.changeCategory = null;
        record.changeOperator = null;
        record.quotaBucket = null;
        record.mutationTelemetry = undefined;
    }

    if (record.runStatus === 'failed' && !record.failureClass) {
        record.failureClass = 'ASSERTION';
        record.failureStage = 'ASSERTION';
    }

    if (record.runStatus === 'invalid') {
        record.failureClass = null;
        record.failureStage = null;
        record.invalidRunReason = record.invalidRunReason ?? 'setup-failure';
    }

    return record;
}

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
            makeBenchmarkRun({ locatorFamily: 'semantic-first', phase: 'mutated', runStatus: 'passed', changeId: 'mut-sem-1', changeOperator: 'SubtreeDelete', changeCategory: 'structural', quotaBucket: 'structural', durationMs: 100, mutationTelemetry: { selectedCandidateId: 'mut-sem-1', selectedTargetSelector: '#target-sem-1', selectedTargetTagType: 'div', operatorRuntimeCategory: 'structural', operatorThesisCategory: 'structural', operatorConsideredCandidateCount: 5, operatorCandidateCount: 5, operatorApplicableCount: 2, operatorSkippedOracleCount: 1, operatorNotApplicableCount: 2, operatorSelectedCount: 1, operatorSelectedApplicableRatio: 0.5, operatorCheckDurationMs: 30, applyDurationMs: 10, applyFailureCount: 0, finalMutationOutcomeClass: 'applied' } }),
            makeBenchmarkRun({ locatorFamily: 'semantic-first', phase: 'mutated', runStatus: 'failed', failureClass: 'NO_MATCH', failureStage: 'ACTION', changeId: 'mut-sem-2', changeOperator: 'SubtreeDelete', changeCategory: 'structural', quotaBucket: 'structural', durationMs: 200, mutationTelemetry: { selectedCandidateId: 'mut-sem-2', selectedTargetSelector: '#target-sem-2', selectedTargetTagType: 'div', operatorRuntimeCategory: 'structural', operatorThesisCategory: 'structural', operatorConsideredCandidateCount: 5, operatorCandidateCount: 5, operatorApplicableCount: 2, operatorSkippedOracleCount: 1, operatorNotApplicableCount: 2, operatorSelectedCount: 1, operatorSelectedApplicableRatio: 0.5, operatorCheckDurationMs: 30, applyDurationMs: 12, applyFailureCount: 0, finalMutationOutcomeClass: 'applied' } }),
            makeBenchmarkRun({ locatorFamily: 'semantic-first', phase: 'baseline', runStatus: 'passed', durationMs: 50 }),
            
            // css: 2 mutated (2 fail ACTIONABILITY), 1 baseline pass
            makeBenchmarkRun({ locatorFamily: 'css', phase: 'mutated', runStatus: 'failed', failureClass: 'ACTIONABILITY', failureStage: 'ACTION', changeId: 'mut-css-1', changeOperator: 'StyleVisibility', changeCategory: 'visibility-interaction-state', quotaBucket: 'visibility', durationMs: 300, mutationTelemetry: { selectedCandidateId: 'mut-css-1', selectedTargetSelector: '#target-css-1', selectedTargetTagType: 'button', operatorRuntimeCategory: 'visibility', operatorThesisCategory: 'visibility-interaction-state', operatorConsideredCandidateCount: 4, operatorCandidateCount: 4, operatorApplicableCount: 1, operatorSkippedOracleCount: 1, operatorNotApplicableCount: 2, operatorSelectedCount: 1, operatorSelectedApplicableRatio: 1, operatorCheckDurationMs: 20, applyDurationMs: 8, applyFailureCount: 0, finalMutationOutcomeClass: 'applied' } }),
            makeBenchmarkRun({ locatorFamily: 'css', phase: 'mutated', runStatus: 'failed', failureClass: 'ACTIONABILITY', failureStage: 'ACTION', changeId: 'mut-css-2', changeOperator: 'StyleVisibility', changeCategory: 'visibility-interaction-state', quotaBucket: 'visibility', durationMs: 400, mutationTelemetry: { selectedCandidateId: 'mut-css-2', selectedTargetSelector: '#target-css-2', selectedTargetTagType: 'button', operatorRuntimeCategory: 'visibility', operatorThesisCategory: 'visibility-interaction-state', operatorConsideredCandidateCount: 4, operatorCandidateCount: 4, operatorApplicableCount: 1, operatorSkippedOracleCount: 1, operatorNotApplicableCount: 2, operatorSelectedCount: 1, operatorSelectedApplicableRatio: 1, operatorCheckDurationMs: 20, applyDurationMs: 9, applyFailureCount: 0, finalMutationOutcomeClass: 'applied' } }),
            makeBenchmarkRun({ locatorFamily: 'css', phase: 'baseline', runStatus: 'passed', durationMs: 60 }),

            // xpath: paired with css mutated runs so discordance reporting has comparable rows
            makeBenchmarkRun({ locatorFamily: 'xpath', phase: 'mutated', runStatus: 'failed', failureClass: 'NO_MATCH', failureStage: 'ACTION', changeId: 'mut-css-1', changeOperator: 'StyleVisibility', changeCategory: 'visibility-interaction-state', quotaBucket: 'visibility', durationMs: 320, mutationTelemetry: { selectedCandidateId: 'mut-css-1', selectedTargetSelector: '#target-xpath-1', selectedTargetTagType: 'button', operatorRuntimeCategory: 'visibility', operatorThesisCategory: 'visibility-interaction-state', operatorConsideredCandidateCount: 4, operatorCandidateCount: 4, operatorApplicableCount: 1, operatorSkippedOracleCount: 1, operatorNotApplicableCount: 2, operatorSelectedCount: 1, operatorSelectedApplicableRatio: 1, operatorCheckDurationMs: 21, applyDurationMs: 8, applyFailureCount: 0, finalMutationOutcomeClass: 'applied' } }),
            makeBenchmarkRun({ locatorFamily: 'xpath', phase: 'mutated', runStatus: 'failed', failureClass: 'ACTIONABILITY', failureStage: 'ACTION', changeId: 'mut-css-2', changeOperator: 'StyleVisibility', changeCategory: 'visibility-interaction-state', quotaBucket: 'visibility', durationMs: 410, mutationTelemetry: { selectedCandidateId: 'mut-css-2', selectedTargetSelector: '#target-xpath-2', selectedTargetTagType: 'button', operatorRuntimeCategory: 'visibility', operatorThesisCategory: 'visibility-interaction-state', operatorConsideredCandidateCount: 4, operatorCandidateCount: 4, operatorApplicableCount: 1, operatorSkippedOracleCount: 1, operatorNotApplicableCount: 2, operatorSelectedCount: 1, operatorSelectedApplicableRatio: 1, operatorCheckDurationMs: 21, applyDurationMs: 9, applyFailureCount: 0, finalMutationOutcomeClass: 'applied' } }),

            // Invalid run (should be ignored)
            makeBenchmarkRun({ locatorFamily: 'xpath', phase: 'mutated', runStatus: 'invalid', comparisonEligible: false, invalidRunReason: 'Setup failure', changeId: 'mut-invalid-1', changeOperator: 'StyleVisibility', changeCategory: 'visibility-interaction-state', quotaBucket: 'visibility' })
        ];

        mockRuns.forEach((run, i) => {
            fs.writeFileSync(path.join(testDataDir, `run_${i}.json`), JSON.stringify(run));
        });

        // 2. Run Aggregation
        const { execSync } = require('child_process');
        execSync(`npx ts-node src/benchmark/runner/aggregate.ts ${testDataDir} ${outputDir}`);

        // 3. Verify Outputs
        expect(fs.existsSync(path.join(outputDir, 'benchmark_runs.csv'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'summary_by_family.csv'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'aggregate_report.json'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'mutation_run_telemetry.csv'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'operator_diversity_summary.csv'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'css_xpath_discordance.csv'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'css_xpath_discordance_summary.csv'))).toBe(true);

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

        const mutationRunTelemetry = fs.readFileSync(path.join(outputDir, 'mutation_run_telemetry.csv'), 'utf8');
        expect(mutationRunTelemetry).toContain('selectedTargetSelector');
        expect(mutationRunTelemetry).toContain('operatorRuntimeCategory');
        expect(mutationRunTelemetry).toContain('operatorSelectedApplicableRatio');

        const operatorDiversity = fs.readFileSync(path.join(outputDir, 'operator_diversity_summary.csv'), 'utf8');
        expect(operatorDiversity).toContain('selectedApplicableRatio');
        expect(operatorDiversity).toContain('discordanceRate');

        const cssXpathDiscordance = fs.readFileSync(path.join(outputDir, 'css_xpath_discordance_summary.csv'), 'utf8');
        expect(cssXpathDiscordance).toContain('overall,2,1,0.5000');
    });

    test('should keep only the latest record for the same logical run identity', async () => {
        const dedupeInputDir = path.join(process.cwd(), 'test-results', 'agg-dedupe-test');
        const dedupeOutputDir = path.join(process.cwd(), 'test-results', 'agg-dedupe-output');
        if (fs.existsSync(dedupeInputDir)) fs.rmSync(dedupeInputDir, { recursive: true });
        if (fs.existsSync(dedupeOutputDir)) fs.rmSync(dedupeOutputDir, { recursive: true });
        fs.mkdirSync(dedupeInputDir, { recursive: true });

        const duplicateRuns = [
            makeBenchmarkRun({ activeScenarioId: 'article.assert-title', scenarioId: 'article.assert-title [semantic-first]', activeScenarioCategory: 'content-access', sourceSpec: 'tests/realworld/article.spec.ts', locatorFamily: 'semantic-first', phase: 'mutated', runStatus: 'passed', changeId: 'candidate-1', changeOperator: 'TextInsert', changeCategory: 'content', quotaBucket: 'content', durationMs: 100 }),
            makeBenchmarkRun({ activeScenarioId: 'article.assert-title', scenarioId: 'article.assert-title [semantic-first]', activeScenarioCategory: 'content-access', sourceSpec: 'tests/realworld/article.spec.ts', locatorFamily: 'semantic-first', phase: 'mutated', runStatus: 'failed', failureClass: 'ASSERTION', failureStage: 'ASSERTION', changeId: 'candidate-1', changeOperator: 'TextInsert', changeCategory: 'content', quotaBucket: 'content', durationMs: 250 }),
        ];

        duplicateRuns.forEach((run, index) => {
            fs.writeFileSync(path.join(dedupeInputDir, `duplicate_${index}.json`), JSON.stringify(run));
        });

        const { execSync } = require('child_process');
        execSync(`npx ts-node src/benchmark/runner/aggregate.ts ${dedupeInputDir} ${dedupeOutputDir}`);

        const benchmarkRuns = fs.readFileSync(path.join(dedupeOutputDir, 'benchmark_runs.csv'), 'utf8');
        expect(benchmarkRuns).toContain('ASSERTION');
        expect(benchmarkRuns).not.toContain(',passed,');

        const summaryByFamily = fs.readFileSync(path.join(dedupeOutputDir, 'summary_by_family.csv'), 'utf8');
        expect(summaryByFamily).toContain('semantic-first,1,1,1,1');
    });

    test('should fail loudly on empty input', async () => {
        const emptyDir = path.join(process.cwd(), 'test-results', 'empty-test');
        if (!fs.existsSync(emptyDir)) fs.mkdirSync(emptyDir, { recursive: true });
        
        const { execSync } = require('child_process');
        try {
            execSync(`npx ts-node src/benchmark/runner/aggregate.ts ${emptyDir} ${outputDir}`);
            throw new Error('Should have failed');
        } catch (e) {
            expect(e instanceof Error ? e.message : String(e)).toContain('No valid results found to aggregate');
        }
    });
});
