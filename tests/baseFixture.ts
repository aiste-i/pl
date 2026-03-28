import { test as base, expect, Locator, Page } from '@playwright/test';
import { MutantGenerator } from '../src/murun/runner/MutantGenerator';
import { WebMutator } from '../src/webmutator/WebMutator';
import { MutationCandidate } from '../src/webmutator/MutationCandidate';
import { StrategyName, STRATEGIES, getTodoMVCLocators, getTodoMVCOracle } from '../src/locators';
import { FailureClassifier, ExecutionStage, FailureClass, ClassificationResult, StructuredEvidence } from '../src/webmutator/utils/FailureClassifier';
import { BenchmarkedLocator, OracleLocator, InstrumentationContext } from '../src/locators/BenchmarkedLocator';
import { AxeBuilder } from '@axe-core/playwright';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

// Define custom options for our tests
export type TestOptions = {
  locatorStrategy: StrategyName;
  mutation?: MutationCandidate;
};

export type AccessibilityScanStatus = 'completed' | 'failed' | 'skipped';

export interface StabilizationMetadata {
    attempted: boolean;
    status: 'completed' | 'timeout-fallback' | 'skipped';
    durationMs: number;
    strategy: string;
}

export interface AccessibilitySummary {
  scanAttempted: boolean;
  scanStatus: AccessibilityScanStatus;
  scanTimestamp?: string;
  scanError?: string | null;
  detailedArtifactWritten: boolean;
  artifactPath: string | null;
  totalViolations: number;
  violationIds: string[];
  impactedNodeCount: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
  // Metadata linkage duplicated here for unambiguous joins if files are separated
  runId: string;
  applicationId: string;
  scenarioId: string;
  phase: 'baseline' | 'mutated';
  stabilization: StabilizationMetadata;
}

export interface BenchmarkResult {
  runId: string;
  applicationId: string;
  scenarioId: string;
  locatorFamily: string;
  semanticEntryPoint?: string;
  phase: 'baseline' | 'mutated';
  changeId?: string;
  changeCategory?: string;
  changeOperator?: string;
  durationMs: number;
  runStatus: 'passed' | 'failed' | 'invalid';
  failureClass: FailureClass | null;
  failureStage: ExecutionStage | null;
  rawErrorName?: string;
  rawErrorMessage?: string;
  classifierReason?: string;
  isTimeout?: boolean;
  isStrictnessViolation?: boolean;
  invalidRunReason?: string;
  oracleIntegrityOk: boolean;
  oracleIntegrityError?: string;
  evidence: StructuredEvidence;
  instrumentationPathUsed: 'structured' | 'fallback' | 'mixed';
  accessibility: AccessibilitySummary;
}

/**
 * Stabilization helper to ensure the page is in a consistent end state before scanning.
 */
async function stabilizePage(page: Page): Promise<StabilizationMetadata> {
    const start = Date.now();
    let status: 'completed' | 'timeout-fallback' | 'skipped' = 'completed';
    
    // 1. Wait for network to be idle
    try {
        await page.waitForLoadState('networkidle', { timeout: 2000 });
    } catch (e) {
        status = 'timeout-fallback';
    }
    
    // 2. Wait for any pending animations/rendering (heuristic)
    try {
        await page.evaluate(() => new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve))));
    } catch (e) {
        status = 'timeout-fallback';
    }
    
    // 3. Buffer for microtasks
    await page.waitForTimeout(200); 

    return {
        attempted: true,
        status: status,
        durationMs: Date.now() - start,
        strategy: 'networkidle + requestAnimationFrame + 200ms'
    };
}

// Extend base test with custom options and fixtures
export const test = base.extend<TestOptions & { 
    benchmarkResult: BenchmarkResult,
    runAction: (action: () => Promise<any>, locator?: Locator) => Promise<any>,
    runAssertion: (assertion: () => Promise<any>) => Promise<any>,
    runOraclePrecheck: (precheck: () => Promise<any>) => Promise<any>,
    locators: ReturnType<typeof getTodoMVCLocators>,
    oracle: ReturnType<typeof getTodoMVCOracle>
}>({
  // Default locator strategy
  locatorStrategy: ['semantic-first', { option: true }],
  // Optional mutation candidate
  mutation: [undefined, { option: true }],

  benchmarkResult: [{} as any, { option: true }],

  runOraclePrecheck: async ({ benchmarkResult }, use) => {
    const runOraclePrecheck = async (precheck: () => Promise<any>) => {
        benchmarkResult.instrumentationPathUsed = 'structured';
        try {
            return await precheck();
        } catch (error) {
            benchmarkResult.oracleIntegrityOk = false;
            benchmarkResult.oracleIntegrityError = error.message;
            const classification = FailureClassifier.classify(error, ExecutionStage.ORACLE_PRECHECK, benchmarkResult.evidence);
            Object.assign(benchmarkResult, classification);
            throw error;
        }
    };
    await use(runOraclePrecheck);
  },

  runAction: async ({ benchmarkResult }, use) => {
    const runAction = async (action: () => Promise<any>, locator?: Locator) => {
        benchmarkResult.instrumentationPathUsed = 'structured';
        benchmarkResult.evidence.actionContextEntered = true;
        if (locator) {
            if ((locator as any).semanticEntryPoint) {
                benchmarkResult.semanticEntryPoint = (locator as any).semanticEntryPoint;
            }
            try {
                const count = await locator.count();
                benchmarkResult.evidence.preActionResolutionObservation = count;
            } catch (e) {
                benchmarkResult.evidence.preActionResolutionObservation = 0;
            }
        }
        
        try {
            benchmarkResult.evidence.actionAttemptStarted = true;
            const result = await action();
            benchmarkResult.evidence.actionCompleted = true;
            return result;
        } catch (error) {
            const classification = FailureClassifier.classify(error, ExecutionStage.ACTION, benchmarkResult.evidence);
            Object.assign(benchmarkResult, classification);
            throw error; 
        }
    };
    await use(runAction);
  },

  runAssertion: async ({ benchmarkResult }, use) => {
    const runAssertion = async (assertion: () => Promise<any>) => {
        benchmarkResult.instrumentationPathUsed = 'structured';
        benchmarkResult.evidence.assertionStageEntered = true;
        try {
            benchmarkResult.evidence.oracleVerificationStarted = true;
            const result = await assertion();
            benchmarkResult.evidence.oracleVerificationCompleted = true;
            return result;
        } catch (error) {
            const classification = FailureClassifier.classify(error, ExecutionStage.ASSERTION, benchmarkResult.evidence);
            Object.assign(benchmarkResult, classification);
            throw error;
        }
    };
    await use(runAssertion);
  },

  locators: async ({ page, locatorStrategy, runAction, runAssertion, runOraclePrecheck }, use) => {
    const context: InstrumentationContext = { runAction, runAssertion, runOraclePrecheck };
    const rawLocators = getTodoMVCLocators(locatorStrategy);
    
    // Wrap the locators to enforce instrumentation
    const wrapped: any = {};
    for (const [key, fn] of Object.entries(rawLocators)) {
        wrapped[key] = (...args: any[]) => {
            const locator = (fn as any)(page, ...args);
            return new BenchmarkedLocator(locator, context);
        };
    }
    await use(wrapped);
  },

  oracle: async ({ page, runAction, runAssertion, runOraclePrecheck }, use) => {
    const context: InstrumentationContext = { runAction, runAssertion, runOraclePrecheck };
    const rawOracle = getTodoMVCOracle();
    const wrapped: any = {};
    for (const [key, fn] of Object.entries(rawOracle)) {
        wrapped[key] = (...args: any[]) => {
            const locator = (fn as any)(page, ...args);
            return new OracleLocator(locator, context);
        };
    }
    await use(wrapped);
  },

  page: async ({ page, locatorStrategy, mutation, benchmarkResult }, use, testInfo) => {
    let appName = 'default';
    const appTag = testInfo.titlePath.join(' ').match(/@app:(\w+)/);
    if (appTag) appName = appTag[1];

    const scenarioId = testInfo.titlePath.join(' > ');
    const runId = uuidv4();
    const phase = mutation ? 'mutated' : 'baseline';
    const startTime = Date.now();

    // Initialize benchmark result with runId and empty accessibility status
    Object.assign(benchmarkResult, {
        runId: runId,
        applicationId: appName,
        scenarioId: scenarioId,
        locatorFamily: locatorStrategy,
        phase: phase,
        durationMs: 0,
        runStatus: 'passed',
        failureClass: null,
        failureStage: null,
        oracleIntegrityOk: true,
        evidence: FailureClassifier.createEmptyEvidence(),
        instrumentationPathUsed: 'fallback',
        accessibility: {
            scanAttempted: false,
            scanStatus: 'skipped',
            detailedArtifactWritten: false,
            artifactPath: null,
            totalViolations: 0,
            violationIds: [],
            impactedNodeCount: 0,
            criticalCount: 0,
            seriousCount: 0,
            moderateCount: 0,
            minorCount: 0,
            runId: runId,
            applicationId: appName,
            scenarioId: scenarioId,
            phase: phase,
            stabilization: {
                attempted: false,
                status: 'skipped',
                durationMs: 0,
                strategy: 'none'
            }
        }
    });

    if (mutation) {
        benchmarkResult.changeId = mutation.selector;
        benchmarkResult.changeOperator = mutation.operator.constructor.name;
        benchmarkResult.changeCategory = mutation.operator.category;
        await page.goto('/'); 
        const mutator = new WebMutator();
        try {
            await mutator.applyMutation(page, mutation.selector, mutation.operator);
        } catch (error) {
            benchmarkResult.runStatus = 'invalid';
            benchmarkResult.invalidRunReason = 'Setup failure during mutation application: ' + error.message;
            // Scan will be skipped for this invalid setup
            benchmarkResult.accessibility.scanStatus = 'skipped';
            throw error;
        }
    }

    try {
        await use(page);
    } catch (error) {
        if (benchmarkResult.runStatus === 'passed') {
             const classification = FailureClassifier.classify(error, ExecutionStage.ACTION, benchmarkResult.evidence);
             Object.assign(benchmarkResult, classification);
             benchmarkResult.instrumentationPathUsed = benchmarkResult.instrumentationPathUsed === 'fallback' ? 'fallback' : 'mixed';
        }
        throw error;
    } finally {
        benchmarkResult.durationMs = Date.now() - startTime;
        // Run accessibility scan at the end of the scenario
        // Policy: Skip scan if the page was never correctly navigated or crashed early
        const skipScan = benchmarkResult.runStatus === 'invalid' && benchmarkResult.invalidRunReason?.includes('Setup failure');
        
        if (!skipScan) {
            try {
                benchmarkResult.accessibility.scanAttempted = true;
                
                // 1. Stabilization
                const stabMetadata = await stabilizePage(page);
                benchmarkResult.accessibility.stabilization = stabMetadata;
                
                // 2. Scan
                const results = await new AxeBuilder({ page }).analyze();
                
                // 3. Populate Summary
                Object.assign(benchmarkResult.accessibility, {
                    scanStatus: 'completed',
                    scanTimestamp: new Date().toISOString(),
                    totalViolations: results.violations.length,
                    violationIds: results.violations.map(v => v.id),
                    impactedNodeCount: results.violations.reduce((acc, v) => acc + v.nodes.length, 0),
                    criticalCount: results.violations.filter(v => v.impact === 'critical').length,
                    seriousCount: results.violations.filter(v => v.impact === 'serious').length,
                    moderateCount: results.violations.filter(v => v.impact === 'moderate').length,
                    minorCount: results.violations.filter(v => v.impact === 'minor').length
                });

                // 4. Persist Detailed Artifact
                const artifactsDir = path.join(process.cwd(), 'test-results', appName, 'accessibility-artifacts');
                if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
                
                const safeScenarioId = scenarioId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const artifactName = `${safeScenarioId}_${runId}_axe.json`;
                const artifactPath = path.join(artifactsDir, artifactName);
                
                // Full mirrored metadata for standalone artifact consumption
                const artifactContent = {
                    metadata: {
                        runId: runId,
                        applicationId: appName,
                        scenarioId: scenarioId,
                        locatorFamily: locatorStrategy,
                        semanticEntryPoint: benchmarkResult.semanticEntryPoint,
                        phase: phase,
                        changeId: benchmarkResult.changeId,
                        changeCategory: benchmarkResult.changeCategory,
                        changeOperator: benchmarkResult.changeOperator,
                        scanStatus: benchmarkResult.accessibility.scanStatus,
                        scanTimestamp: benchmarkResult.accessibility.scanTimestamp,
                        benchmarkRunStatus: benchmarkResult.runStatus,
                        formatVersion: '1.1.0'
                    },
                    axeResults: results
                };

                fs.writeFileSync(artifactPath, JSON.stringify(artifactContent, null, 2));
                
                // 5. Normalize Path (POSIX relative)
                benchmarkResult.accessibility.artifactPath = path.relative(process.cwd(), artifactPath).split(path.sep).join('/');
                benchmarkResult.accessibility.detailedArtifactWritten = true;
                
            } catch (axeError: any) {
                benchmarkResult.accessibility.scanStatus = 'failed';
                benchmarkResult.accessibility.scanError = axeError.message;
                console.error(`Accessibility scan failed for run ${runId}:`, axeError.message);
            }
        } else {
            benchmarkResult.accessibility.scanStatus = 'skipped';
        }

        // Save main benchmark result
        const resultsDir = path.join(process.cwd(), 'test-results', appName, 'benchmark-runs');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
        const safeScenarioId = scenarioId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const resultPath = path.join(resultsDir, `${safeScenarioId}_${runId}.json`);
        fs.writeFileSync(resultPath, JSON.stringify(benchmarkResult, null, 2));
    }
  },
});

export { expect };
