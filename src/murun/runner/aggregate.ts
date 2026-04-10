import * as fs from 'fs';
import * as path from 'path';
import { getAppResultsDir, getSelectedAppId } from '../../apps';
import { getOperatorCatalog } from '../../webmutator/operators/catalog';
import { createRunMetadata, writeCsvRows } from '../../benchmark/result-contract';
import { validateBenchmarkPayload } from '../../benchmark/result-schema-validator';

interface AggregatedRun {
    runId: string;
    applicationId: string;
    browserName: string;
    corpusId: string;
    scenarioId: string;
    activeScenarioId: string;
    activeScenarioCategory: string;
    sourceSpec: string;
    locatorFamily: string;
    semanticEntryPoint: string;
    phase: 'baseline' | 'mutated';
    runStatus: 'passed' | 'failed' | 'invalid';
    failureClass: string;
    changeId: string;
    changeCategory: string;
    changeOperator: string;
    quotaBucket: string;
    comparisonEligible: boolean;
    comparisonExclusionReason: string;
    durationMs: number;
    accessibilityScanStatus: 'completed' | 'failed' | 'skipped';
    totalViolations: number;
    criticalViolations: number;
    impactedNodes: number;
    mutationTelemetry?: {
        selectedCandidateId: string | null;
        selectedTargetSelector: string | null;
        selectedTargetTagType: string | null;
        operatorRuntimeCategory: string | null;
        operatorThesisCategory: string | null;
        operatorConsideredCandidateCount: number | null;
        operatorCandidateCount: number | null;
        operatorApplicableCount: number | null;
        operatorSkippedOracleCount: number | null;
        operatorNotApplicableCount: number | null;
        operatorCheckDurationMs: number | null;
        applyDurationMs: number | null;
        applyFailureCount: number;
        finalMutationOutcomeClass: string | null;
    };
    recordedAtMs?: number;
}

interface UnsupportedRow {
    app: string;
    logicalKey: string;
    family: string;
    supported: boolean;
    reason: string | null;
    excludedFromAggregateComparison: boolean;
    aggregateComparisonEligible: boolean;
    activeInCorpus?: boolean;
    activeScenarioIds?: string[];
    specHints: string[];
}

const CATEGORY_MAPPING: Record<string, string> = Object.fromEntries(
    getOperatorCatalog().map(entry => [entry.type, entry.thesisCategory === 'visibility-interaction-state' ? 'visibility-interaction-state' : entry.thesisCategory]),
);

function getCategory(operator: string, existingCategory?: string): string {
    if (existingCategory) return existingCategory;
    return CATEGORY_MAPPING[operator] || 'unknown';
}

function getAllFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

function buildRunIdentity(run: AggregatedRun): string {
    const mutationIdentity =
        run.phase === 'mutated'
            ? run.changeId && run.changeId !== 'none'
                ? run.changeId
                : run.runId
            : 'baseline';

    return [
        run.applicationId,
        run.browserName,
        run.corpusId,
        run.activeScenarioId,
        run.locatorFamily,
        run.phase,
        mutationIdentity,
    ].join('|');
}

function dedupeRuns(runs: AggregatedRun[]): AggregatedRun[] {
    const latestByIdentity = new Map<string, AggregatedRun>();

    for (const run of runs) {
        const identity = buildRunIdentity(run);
        const existing = latestByIdentity.get(identity);
        if (!existing || (run.recordedAtMs ?? 0) >= (existing.recordedAtMs ?? 0)) {
            latestByIdentity.set(identity, run);
        }
    }

    return [...latestByIdentity.values()].sort((left, right) => (left.recordedAtMs ?? 0) - (right.recordedAtMs ?? 0));
}

function loadResults(inputDir: string): AggregatedRun[] {
    const runs: AggregatedRun[] = [];
    const files = getAllFiles(inputDir).filter(f => f.endsWith('.json') && !f.includes('axe.json'));

    for (const file of files) {
        try {
            const stat = fs.statSync(file);
            const content = JSON.parse(fs.readFileSync(file, 'utf8'));
            const validation = validateBenchmarkPayload(content, file);
            if (!validation.valid) {
                const details = validation.errors
                    .map(error => `${error.jsonPath}: ${error.message}`)
                    .join('; ');
                throw new Error(`Invalid benchmark result structure in ${file}: ${details}`);
            }
            if (!content.runId || !content.locatorFamily || !content.phase) {
                console.warn(`Skipping malformed record: ${file}`);
                continue;
            }
            if (!content.corpusId || !content.activeScenarioId) {
                console.warn(`Skipping legacy non-corpus benchmark record: ${file}`);
                continue;
            }

            runs.push({
                runId: content.runId,
                applicationId: content.applicationId || 'unknown',
                browserName: content.browserName || 'unknown',
                corpusId: content.corpusId,
                scenarioId: content.scenarioId || 'unknown',
                activeScenarioId: content.activeScenarioId,
                activeScenarioCategory: content.activeScenarioCategory || 'unknown',
                sourceSpec: content.sourceSpec || 'unknown',
                locatorFamily: content.locatorFamily,
                semanticEntryPoint: content.semanticEntryPoint || 'none',
                phase: content.phase,
                runStatus: content.runStatus,
                failureClass: content.failureClass || 'none',
                changeId: content.changeId || 'none',
                changeOperator: content.changeOperator || 'none',
                changeCategory: getCategory(content.changeOperator, content.changeCategory),
                quotaBucket: content.quotaBucket || getCategory(content.changeOperator, content.changeCategory),
                comparisonEligible: content.comparisonEligible !== false,
                comparisonExclusionReason: content.comparisonExclusionReason || 'none',
                durationMs: content.durationMs || 0,
                accessibilityScanStatus: content.accessibility?.scanStatus || 'skipped',
                totalViolations: content.accessibility?.totalViolations || 0,
                criticalViolations: content.accessibility?.criticalCount || 0,
                impactedNodes: content.accessibility?.impactedNodeCount || 0,
                mutationTelemetry: content.mutationTelemetry || undefined,
                recordedAtMs: stat.mtimeMs,
            });
        } catch (e) {
            throw new Error(`Failed to load benchmark result ${file}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    return dedupeRuns(runs);
}

function writeCsv(filePath: string, data: any[]) {
    if (data.length === 0) return;
    writeCsvRows(filePath, data);
}

function mean(values: number[]): number {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function aggregate(runs: AggregatedRun[], outputDir: string) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    writeCsv(path.join(outputDir, 'benchmark_runs.csv'), runs);

    const mutated = runs.filter(r => r.phase === 'mutated');
    const baseline = runs.filter(r => r.phase === 'baseline');
    const families = Array.from(new Set(runs.map(r => r.locatorFamily)));
    const appsInRuns = Array.from(new Set(runs.map(run => run.applicationId)));
    const corpusIds = Array.from(new Set(runs.map(run => run.corpusId)));
    const activeScenarioIds = Array.from(new Set(runs.map(run => run.activeScenarioId))).sort();

    const unsupportedPath = path.join(process.cwd(), 'reports', 'realworld-locator-unsupported.json');
    let unsupportedRows: UnsupportedRow[] = [];
    if (fs.existsSync(unsupportedPath)) {
        unsupportedRows = JSON.parse(fs.readFileSync(unsupportedPath, 'utf8')).filter((row: UnsupportedRow) => appsInRuns.includes(row.app));
    }

    if (unsupportedRows.length > 0) {
        writeCsv(path.join(outputDir, 'excluded_unsupported.csv'), unsupportedRows);
        fs.writeFileSync(path.join(outputDir, 'excluded_unsupported.json'), JSON.stringify(unsupportedRows, null, 2));
    }

    const summaryByFamily = families.map(family => {
        const familyRuns = runs.filter(r => r.locatorFamily === family);
        const familyMutated = familyRuns.filter(r => r.phase === 'mutated');
        const failedMutated = familyMutated.filter(r => r.runStatus === 'failed');
        const comparableMutated = familyMutated.filter(r => r.comparisonEligible);
        const durations = familyMutated.map(r => r.durationMs).sort((a, b) => a - b);

        return {
            family,
            totalRuns: familyRuns.length,
            mutatedRuns: familyMutated.length,
            comparableMutatedRuns: comparableMutated.length,
            failedMutatedRuns: failedMutated.length,
            failedComparableMutatedRuns: comparableMutated.filter(r => r.runStatus === 'failed').length,
            failureRateMutated: (failedMutated.length / familyMutated.length || 0).toFixed(4),
            failureRateComparableMutated: (comparableMutated.filter(r => r.runStatus === 'failed').length / comparableMutated.length || 0).toFixed(4),
            baselinePassRate: (familyRuns.filter(r => r.phase === 'baseline' && r.runStatus === 'passed').length / familyRuns.filter(r => r.phase === 'baseline').length || 0).toFixed(4),
            meanDurationMs: mean(durations).toFixed(2),
            medianDurationMs: (durations[Math.floor(durations.length / 2)] || 0).toFixed(2),
        };
    });
    writeCsv(path.join(outputDir, 'summary_by_family.csv'), summaryByFamily);

    const categories = Array.from(new Set(mutated.map(r => r.changeCategory)));
    const summaryByFamilyCategory = [];
    for (const family of families) {
        for (const category of categories) {
            const cellRuns = mutated.filter(r => r.locatorFamily === family && r.changeCategory === category);
            if (cellRuns.length === 0) continue;
            const comparable = cellRuns.filter(r => r.comparisonEligible);
            const failedComparable = comparable.filter(r => r.runStatus === 'failed');
            summaryByFamilyCategory.push({
                family,
                category,
                totalMutated: cellRuns.length,
                comparableMutated: comparable.length,
                failedComparableMutated: failedComparable.length,
                failureRateComparable: (failedComparable.length / comparable.length || 0).toFixed(4),
                meanDuration: mean(cellRuns.map(r => r.durationMs)).toFixed(2),
                meanViolationsComparable: mean(comparable.map(r => r.totalViolations)).toFixed(2),
            });
        }
    }
    writeCsv(path.join(outputDir, 'summary_by_family_and_category.csv'), summaryByFamilyCategory);

    const operators = Array.from(new Set(mutated.map(r => r.changeOperator)));
    const summaryByFamilyOperator = [];
    for (const family of families) {
        for (const operator of operators) {
            const cellRuns = mutated.filter(r => r.locatorFamily === family && r.changeOperator === operator);
            if (cellRuns.length === 0) continue;
            const comparable = cellRuns.filter(r => r.comparisonEligible);
            summaryByFamilyOperator.push({
                family,
                operator,
                totalMutated: cellRuns.length,
                comparableMutated: comparable.length,
                failedComparableMutated: comparable.filter(r => r.runStatus === 'failed').length,
                failureRateComparable: (comparable.filter(r => r.runStatus === 'failed').length / comparable.length || 0).toFixed(4),
            });
        }
    }
    writeCsv(path.join(outputDir, 'summary_by_family_and_operator.csv'), summaryByFamilyOperator);

    const failureClasses = Array.from(new Set(mutated.filter(r => r.runStatus === 'failed').map(r => r.failureClass)));
    const failureDist = [];
    for (const family of families) {
        const familyFailed = mutated.filter(r => r.locatorFamily === family && r.runStatus === 'failed');
        if (familyFailed.length === 0) continue;
        for (const failureClass of failureClasses) {
            const count = familyFailed.filter(r => r.failureClass === failureClass).length;
            failureDist.push({
                family,
                failureClass,
                count,
                proportion: (count / familyFailed.length).toFixed(4)
            });
        }
    }
    writeCsv(path.join(outputDir, 'failure_distribution.csv'), failureDist);

    const appSummary = appsInRuns.map(app => {
        const appRuns = runs.filter(run => run.applicationId === app);
        const mutatedRuns = appRuns.filter(run => run.phase === 'mutated');
        return {
            applicationId: app,
            corpusId: Array.from(new Set(appRuns.map(run => run.corpusId))).join('|'),
            totalRuns: appRuns.length,
            mutatedRuns: mutatedRuns.length,
            failedRuns: appRuns.filter(run => run.runStatus === 'failed').length,
            invalidRuns: appRuns.filter(run => run.runStatus === 'invalid').length,
            unsupportedExclusions: unsupportedRows.filter(row => row.app === app && row.activeInCorpus !== false).length,
        };
    });
    writeCsv(path.join(outputDir, 'summary_by_app.csv'), appSummary);

    const browserSummary = Array.from(new Set(runs.map(run => run.browserName))).sort().map(browserName => {
        const browserRuns = runs.filter(run => run.browserName === browserName);
        return {
            browserName,
            totalRuns: browserRuns.length,
            baselineRuns: browserRuns.filter(run => run.phase === 'baseline').length,
            mutatedRuns: browserRuns.filter(run => run.phase === 'mutated').length,
            failedRuns: browserRuns.filter(run => run.runStatus === 'failed').length,
        };
    });
    writeCsv(path.join(outputDir, 'summary_by_browser.csv'), browserSummary);

    const browserNames = Array.from(new Set(runs.map(run => run.browserName))).sort();
    const summaryByBrowserFamily = [];
    for (const browserName of browserNames) {
        for (const family of families) {
            const cellRuns = runs.filter(run => run.browserName === browserName && run.locatorFamily === family);
            if (cellRuns.length === 0) continue;
            const cellMutated = cellRuns.filter(run => run.phase === 'mutated');
            const comparableMutated = cellMutated.filter(run => run.comparisonEligible);
            summaryByBrowserFamily.push({
                browserName,
                family,
                totalRuns: cellRuns.length,
                baselineRuns: cellRuns.filter(run => run.phase === 'baseline').length,
                mutatedRuns: cellMutated.length,
                comparableMutatedRuns: comparableMutated.length,
                failedComparableMutatedRuns: comparableMutated.filter(run => run.runStatus === 'failed').length,
                failureRateComparableMutated: (comparableMutated.filter(run => run.runStatus === 'failed').length / comparableMutated.length || 0).toFixed(4),
            });
        }
    }
    writeCsv(path.join(outputDir, 'summary_by_browser_and_family.csv'), summaryByBrowserFamily);

    const summaryByBrowserFamilyCategory = [];
    for (const browserName of browserNames) {
        for (const family of families) {
            for (const category of categories) {
                const cellRuns = mutated.filter(run => run.browserName === browserName && run.locatorFamily === family && run.changeCategory === category);
                if (cellRuns.length === 0) continue;
                const comparable = cellRuns.filter(run => run.comparisonEligible);
                summaryByBrowserFamilyCategory.push({
                    browserName,
                    family,
                    category,
                    totalMutated: cellRuns.length,
                    comparableMutated: comparable.length,
                    failedComparableMutated: comparable.filter(run => run.runStatus === 'failed').length,
                    failureRateComparable: (comparable.filter(run => run.runStatus === 'failed').length / comparable.length || 0).toFixed(4),
                });
            }
        }
    }
    writeCsv(path.join(outputDir, 'summary_by_browser_family_and_category.csv'), summaryByBrowserFamilyCategory);

    const exclusionSummary = [
        ...unsupportedRows.map(row => ({
            exclusionType: 'unsupported-coverage',
            app: row.app,
            family: row.family,
            logicalKey: row.logicalKey,
            reason: row.reason,
            activeInCorpus: row.activeInCorpus ?? false,
        })),
        ...mutated
            .filter(run => !run.comparisonEligible)
            .map(run => ({
                exclusionType: 'run-level',
                app: run.applicationId,
                family: run.locatorFamily,
                logicalKey: run.changeId,
                reason: run.comparisonExclusionReason,
                activeInCorpus: true,
            })),
    ];
    writeCsv(path.join(outputDir, 'exclusion_summary.csv'), exclusionSummary);

    const comparisonDenominators = families.map(family => {
        const familyMutated = mutated.filter(run => run.locatorFamily === family);
        const comparableMutated = familyMutated.filter(run => run.comparisonEligible);
        return {
            family,
            totalMutatedRuns: familyMutated.length,
            comparableMutatedRuns: comparableMutated.length,
            excludedMutatedRuns: familyMutated.length - comparableMutated.length,
            invalidMutatedRuns: familyMutated.filter(run => run.runStatus === 'invalid').length,
        };
    });
    writeCsv(path.join(outputDir, 'comparison_denominators.csv'), comparisonDenominators);

    const accessibilityScanStatusSummary = families.map(family => {
        const familyRuns = runs.filter(run => run.locatorFamily === family);
        return {
            family,
            completedScans: familyRuns.filter(run => run.accessibilityScanStatus === 'completed').length,
            failedScans: familyRuns.filter(run => run.accessibilityScanStatus === 'failed').length,
            skippedScans: familyRuns.filter(run => run.accessibilityScanStatus === 'skipped').length,
        };
    });
    writeCsv(path.join(outputDir, 'accessibility_scan_status_summary.csv'), accessibilityScanStatusSummary);

    const accessibilitySummaryCompletedOnly = families.map(family => {
        const completedBaseline = baseline.filter(run => run.locatorFamily === family && run.runStatus !== 'invalid' && run.accessibilityScanStatus === 'completed');
        const completedMutated = mutated.filter(run => run.locatorFamily === family && run.runStatus !== 'invalid' && run.accessibilityScanStatus === 'completed');
        return {
            family,
            completedBaselineScans: completedBaseline.length,
            completedMutatedScans: completedMutated.length,
            meanViolationsBaselineCompletedOnly: mean(completedBaseline.map(run => run.totalViolations)).toFixed(2),
            meanViolationsMutatedCompletedOnly: mean(completedMutated.map(run => run.totalViolations)).toFixed(2),
            meanCriticalMutatedCompletedOnly: mean(completedMutated.map(run => run.criticalViolations)).toFixed(2),
            meanImpactedNodesMutatedCompletedOnly: mean(completedMutated.map(run => run.impactedNodes)).toFixed(2),
        };
    });
    writeCsv(path.join(outputDir, 'accessibility_summary_completed_only.csv'), accessibilitySummaryCompletedOnly);

    const accessibilitySummaryAllValidRuns = families.map(family => {
        const familyBaseline = baseline.filter(run => run.locatorFamily === family && run.runStatus !== 'invalid');
        const familyMutated = mutated.filter(run => run.locatorFamily === family && run.runStatus !== 'invalid');
        return {
            family,
            baselineValidRuns: familyBaseline.length,
            mutatedValidRuns: familyMutated.length,
            baselineCompletedScans: familyBaseline.filter(run => run.accessibilityScanStatus === 'completed').length,
            mutatedCompletedScans: familyMutated.filter(run => run.accessibilityScanStatus === 'completed').length,
            baselineFailedScans: familyBaseline.filter(run => run.accessibilityScanStatus === 'failed').length,
            mutatedFailedScans: familyMutated.filter(run => run.accessibilityScanStatus === 'failed').length,
            baselineSkippedScans: familyBaseline.filter(run => run.accessibilityScanStatus === 'skipped').length,
            mutatedSkippedScans: familyMutated.filter(run => run.accessibilityScanStatus === 'skipped').length,
            baselineCompletedScanRate: (familyBaseline.filter(run => run.accessibilityScanStatus === 'completed').length / familyBaseline.length || 0).toFixed(4),
            mutatedCompletedScanRate: (familyMutated.filter(run => run.accessibilityScanStatus === 'completed').length / familyMutated.length || 0).toFixed(4),
        };
    });
    writeCsv(path.join(outputDir, 'accessibility_summary_all_valid_runs.csv'), accessibilitySummaryAllValidRuns);

    const mutationRunTelemetry = mutated.map(run => ({
        runId: run.runId,
        applicationId: run.applicationId,
        browserName: run.browserName,
        corpusId: run.corpusId,
        activeScenarioId: run.activeScenarioId,
        locatorFamily: run.locatorFamily,
        changeOperator: run.changeOperator,
        changeCategory: run.changeCategory,
        operatorRuntimeCategory: run.mutationTelemetry?.operatorRuntimeCategory ?? null,
        operatorThesisCategory: run.mutationTelemetry?.operatorThesisCategory ?? null,
        selectedCandidateId: run.mutationTelemetry?.selectedCandidateId ?? null,
        selectedTargetSelector: run.mutationTelemetry?.selectedTargetSelector ?? null,
        selectedTargetTagType: run.mutationTelemetry?.selectedTargetTagType ?? null,
        operatorConsideredCandidateCount: run.mutationTelemetry?.operatorConsideredCandidateCount ?? null,
        operatorCandidateCount: run.mutationTelemetry?.operatorCandidateCount ?? null,
        operatorApplicableCount: run.mutationTelemetry?.operatorApplicableCount ?? null,
        operatorSkippedOracleCount: run.mutationTelemetry?.operatorSkippedOracleCount ?? null,
        operatorNotApplicableCount: run.mutationTelemetry?.operatorNotApplicableCount ?? null,
        operatorCheckDurationMs: run.mutationTelemetry?.operatorCheckDurationMs ?? null,
        applyDurationMs: run.mutationTelemetry?.applyDurationMs ?? null,
        applyFailureCount: run.mutationTelemetry?.applyFailureCount ?? 0,
        finalMutationOutcomeClass: run.mutationTelemetry?.finalMutationOutcomeClass ?? null,
    }));
    writeCsv(path.join(outputDir, 'mutation_run_telemetry.csv'), mutationRunTelemetry);

    const operatorTelemetrySummary = operators.map(operator => {
        const operatorRuns = mutated.filter(run => run.changeOperator === operator);
        return {
            operator,
            totalMutatedRuns: operatorRuns.length,
            distinctSelectedCandidates: new Set(operatorRuns.map(run => run.mutationTelemetry?.selectedCandidateId).filter(Boolean)).size,
            totalCandidateCount: operatorRuns.reduce((sum, run) => sum + (run.mutationTelemetry?.operatorCandidateCount ?? 0), 0),
            totalConsideredCandidateCount: operatorRuns.reduce((sum, run) => sum + (run.mutationTelemetry?.operatorConsideredCandidateCount ?? 0), 0),
            totalApplicableCount: operatorRuns.reduce((sum, run) => sum + (run.mutationTelemetry?.operatorApplicableCount ?? 0), 0),
            totalSkippedOracleCount: operatorRuns.reduce((sum, run) => sum + (run.mutationTelemetry?.operatorSkippedOracleCount ?? 0), 0),
            totalNotApplicableCount: operatorRuns.reduce((sum, run) => sum + (run.mutationTelemetry?.operatorNotApplicableCount ?? 0), 0),
            totalCheckDurationMs: operatorRuns.reduce((sum, run) => sum + (run.mutationTelemetry?.operatorCheckDurationMs ?? 0), 0),
            totalApplyDurationMs: operatorRuns.reduce((sum, run) => sum + (run.mutationTelemetry?.applyDurationMs ?? 0), 0),
            totalApplyFailures: operatorRuns.reduce((sum, run) => sum + (run.mutationTelemetry?.applyFailureCount ?? 0), 0),
            sampledTargetSelectors: JSON.stringify(
                Array.from(new Set(operatorRuns.map(run => run.mutationTelemetry?.selectedTargetSelector).filter(Boolean))).slice(0, 5),
            ),
            finalOutcomeClasses: JSON.stringify(
                operatorRuns.reduce((acc, run) => {
                    const outcome = run.mutationTelemetry?.finalMutationOutcomeClass;
                    if (outcome) {
                        acc[outcome] = (acc[outcome] || 0) + 1;
                    }
                    return acc;
                }, {} as Record<string, number>),
            ),
        };
    });
    writeCsv(path.join(outputDir, 'operator_telemetry_summary.csv'), operatorTelemetrySummary);

    const report = {
        generatedAt: new Date().toISOString(),
        corpusId: corpusIds.length === 1 ? corpusIds[0] : corpusIds,
        activeScenarioIds,
        applications: appSummary,
        browsers: browserSummary,
        summaryByBrowserFamily,
        summaryByBrowserFamilyCategory,
        summaryByFamily,
        summaryByFamilyCategory,
        summaryByFamilyOperator,
        failureDistribution: failureDist,
        comparisonDenominators,
        exclusions: exclusionSummary,
        accessibility: {
            scanStatusSummary: accessibilityScanStatusSummary,
            completedOnly: accessibilitySummaryCompletedOnly,
            allValidRuns: accessibilitySummaryAllValidRuns,
        },
        mutationRunTelemetry,
        operatorTelemetrySummary,
        operatorCounts: operators.map(operator => ({
            operator,
            totalMutated: mutated.filter(run => run.changeOperator === operator).length,
            comparableMutated: mutated.filter(run => run.changeOperator === operator && run.comparisonEligible).length,
        })),
        categoryCounts: categories.map(category => ({
            category,
            totalMutated: mutated.filter(run => run.changeCategory === category).length,
            comparableMutated: mutated.filter(run => run.changeCategory === category && run.comparisonEligible).length,
        })),
        excludedUnsupported: unsupportedRows,
    };
    fs.writeFileSync(path.join(outputDir, 'aggregate_report.json'), JSON.stringify(report, null, 2));
    const metadata = createRunMetadata({
        runId: `aggregate-${Date.now()}`,
        generatedAt: report.generatedAt,
        applicationId: appsInRuns.length === 1 ? appsInRuns[0] : 'multi-app',
        browserName: browserSummary.length === 1 ? browserSummary[0].browserName : 'chromium',
        corpusId: corpusIds.length === 1 ? corpusIds[0] : corpusIds.join('|'),
        browserSetUsed: browserNames,
        selectedScenarios: activeScenarioIds,
        selectedApps: appsInRuns,
        selectedMutationIds: mutated.map(run => run.changeId).filter(changeId => changeId && changeId !== 'none'),
        totalCandidatesConsidered: mutated.length,
        executionMode: 'aggregate',
    });
    fs.writeFileSync(path.join(outputDir, 'run-metadata.json'), JSON.stringify(metadata, null, 2));

    console.log(`Aggregation complete. Results written to ${outputDir}`);
}

const args = process.argv.slice(2);
const selectedAppId = getSelectedAppId();
const defaultAppResultsDir = getAppResultsDir(selectedAppId);
const inputDir = path.resolve(args[0] || path.join(defaultAppResultsDir, 'benchmark-runs'));
const outputDir = path.resolve(args[1] || path.join(defaultAppResultsDir, 'aggregate'));

if (!fs.existsSync(inputDir)) {
    console.error(`Input directory does not exist: ${inputDir}`);
    process.exit(1);
}

const runs = loadResults(inputDir);
if (runs.length === 0) {
    console.error('No valid results found to aggregate.');
    process.exit(1);
}

aggregate(runs, outputDir);
