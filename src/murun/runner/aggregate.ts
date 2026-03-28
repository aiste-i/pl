import * as fs from 'fs';
import * as path from 'path';

/**
 * Benchmark Aggregation Script
 * Processes JSON result files into CSV summaries for thesis reporting.
 */

interface AggregatedRun {
    runId: string;
    applicationId: string;
    scenarioId: string;
    locatorFamily: string;
    semanticEntryPoint: string;
    phase: 'baseline' | 'mutated';
    runStatus: 'passed' | 'failed' | 'invalid';
    failureClass: string;
    changeId: string;
    changeCategory: string;
    changeOperator: string;
    durationMs: number;
    totalViolations: number;
    criticalViolations: number;
    impactedNodes: number;
}

const CATEGORY_MAPPING: Record<string, string> = {
    'SubtreeDelete': 'structural',
    'SubtreeInsert': 'structural',
    'SubtreeMove': 'structural',
    'SubtreeSwap': 'structural',
    'TagMutator': 'structural',
    'ContainerNodeMutator': 'structural',
    'AttributeAdd': 'structural',
    'AttributeDelete': 'structural',
    'AttributeReplace': 'structural',
    'AttributeMutator': 'structural',
    'SemanticToDiv': 'structural',
    'ReplaceImageWithDiv': 'structural',
    'ReplaceAnchorWithSpan': 'structural',
    'ReplaceHeadingWithP': 'structural',
    'ReplaceThWithTd': 'structural',
    'TextDelete': 'content',
    'TextInsert': 'content',
    'TextNodeMutator': 'content',
    'TextReplace': 'content',
    'ChangeImageAlt': 'content',
    'RemoveImageAlt': 'content',
    'ChangeButtonLabel': 'content',
    'ActionableNodeMutator': 'accessibility-semantic',
    'DuplicateId': 'accessibility-semantic',
    'RemoveInputNames': 'accessibility-semantic',
    'StyleVisibility': 'visibility',
    'StylePosition': 'visibility',
    'StyleSize': 'visibility',
    'StyleColor': 'visibility'
};

function getCategory(operator: string, existingCategory?: string): string {
    if (existingCategory) return existingCategory;
    return CATEGORY_MAPPING[operator] || 'unknown';
}

function loadResults(inputDir: string): AggregatedRun[] {
    const runs: AggregatedRun[] = [];
    const files = getAllFiles(inputDir).filter(f => f.endsWith('.json') && !f.includes('axe.json'));

    for (const file of files) {
        try {
            const content = JSON.parse(fs.readFileSync(file, 'utf8'));
            
            // Validate required fields
            if (!content.runId || !content.locatorFamily || !content.phase) {
                console.warn(`Skipping malformed record: ${file}`);
                continue;
            }

            // Skip invalid runs from main metrics
            if (content.runStatus === 'invalid') continue;

            const run: AggregatedRun = {
                runId: content.runId,
                applicationId: content.applicationId || 'unknown',
                scenarioId: content.scenarioId || 'unknown',
                locatorFamily: content.locatorFamily,
                semanticEntryPoint: content.semanticEntryPoint || 'none',
                phase: content.phase,
                runStatus: content.runStatus,
                failureClass: content.failureClass || 'none',
                changeId: content.changeId || 'none',
                changeOperator: content.changeOperator || 'none',
                changeCategory: getCategory(content.changeOperator, content.changeCategory),
                durationMs: content.durationMs || 0,
                totalViolations: content.accessibility?.totalViolations || 0,
                criticalViolations: content.accessibility?.criticalCount || 0,
                impactedNodes: content.accessibility?.impactedNodeCount || 0
            };

            runs.push(run);
        } catch (e) {
            console.error(`Failed to parse ${file}:`, e);
        }
    }
    return runs;
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

function writeCsv(filePath: string, data: any[]) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
        Object.values(row).map(val => {
            if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
            return val;
        }).join(',')
    );
    fs.writeFileSync(filePath, [headers, ...rows].join('\n'));
}

function aggregate(runs: AggregatedRun[], outputDir: string) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // 1. benchmark_runs.csv
    writeCsv(path.join(outputDir, 'benchmark_runs.csv'), runs);

    const mutated = runs.filter(r => r.phase === 'mutated');
    const baseline = runs.filter(r => r.phase === 'baseline');
    const families = Array.from(new Set(runs.map(r => r.locatorFamily)));

    // 2. summary_by_family.csv
    const summaryByFamily = families.map(family => {
        const familyRuns = runs.filter(r => r.locatorFamily === family);
        const familyMutated = familyRuns.filter(r => r.phase === 'mutated');
        const familyBaseline = familyRuns.filter(r => r.phase === 'baseline');
        const failedMutated = familyMutated.filter(r => r.runStatus === 'failed');
        
        const durations = familyMutated.map(r => r.durationMs).sort((a, b) => a - b);
        const meanDuration = durations.reduce((a, b) => a + b, 0) / durations.length || 0;
        const medianDuration = durations[Math.floor(durations.length / 2)] || 0;

        return {
            family,
            totalRuns: familyRuns.length,
            mutatedRuns: familyMutated.length,
            failedMutatedRuns: failedMutated.length,
            failureRateMutated: (failedMutated.length / familyMutated.length || 0).toFixed(4),
            baselinePassRate: (familyBaseline.filter(r => r.runStatus === 'passed').length / familyBaseline.length || 0).toFixed(4),
            meanDurationMs: meanDuration.toFixed(2),
            medianDurationMs: medianDuration.toFixed(2)
        };
    });
    writeCsv(path.join(outputDir, 'summary_by_family.csv'), summaryByFamily);

    // 3. summary_by_family_and_category.csv
    const categories = Array.from(new Set(mutated.map(r => r.changeCategory)));
    const summaryByFamilyCategory = [];
    for (const family of families) {
        for (const category of categories) {
            const cellRuns = mutated.filter(r => r.locatorFamily === family && r.changeCategory === category);
            if (cellRuns.length === 0) continue;
            const failed = cellRuns.filter(r => r.runStatus === 'failed');
            summaryByFamilyCategory.push({
                family,
                category,
                totalMutated: cellRuns.length,
                failedMutated: failed.length,
                failureRate: (failed.length / cellRuns.length).toFixed(4),
                meanDuration: (cellRuns.reduce((a, b) => a + b.durationMs, 0) / cellRuns.length).toFixed(2),
                meanViolations: (cellRuns.reduce((a, b) => a + b.totalViolations, 0) / cellRuns.length).toFixed(2)
            });
        }
    }
    writeCsv(path.join(outputDir, 'summary_by_family_and_category.csv'), summaryByFamilyCategory);

    // 4. summary_by_family_and_operator.csv
    const operators = Array.from(new Set(mutated.map(r => r.changeOperator)));
    const summaryByFamilyOperator = [];
    for (const family of families) {
        for (const operator of operators) {
            const cellRuns = mutated.filter(r => r.locatorFamily === family && r.changeOperator === operator);
            if (cellRuns.length === 0) continue;
            const failed = cellRuns.filter(r => r.runStatus === 'failed');
            summaryByFamilyOperator.push({
                family,
                operator,
                totalMutated: cellRuns.length,
                failedMutated: failed.length,
                failureRate: (failed.length / cellRuns.length).toFixed(4)
            });
        }
    }
    writeCsv(path.join(outputDir, 'summary_by_family_and_operator.csv'), summaryByFamilyOperator);

    // 5. failure_distribution.csv
    const failureClasses = Array.from(new Set(mutated.filter(r => r.runStatus === 'failed').map(r => r.failureClass)));
    const failureDist = [];
    for (const family of families) {
        const familyFailed = mutated.filter(r => r.locatorFamily === family && r.runStatus === 'failed');
        if (familyFailed.length === 0) continue;
        for (const fClass of failureClasses) {
            const count = familyFailed.filter(r => r.failureClass === fClass).length;
            failureDist.push({
                family,
                failureClass: fClass,
                count,
                proportion: (count / familyFailed.length).toFixed(4)
            });
        }
    }
    writeCsv(path.join(outputDir, 'failure_distribution.csv'), failureDist);

    // 6. accessibility_summary.csv
    const a11ySummary = families.map(family => {
        const familyMutated = mutated.filter(r => r.locatorFamily === family);
        const familyBaseline = baseline.filter(r => r.locatorFamily === family);
        return {
            family,
            meanViolationsBaseline: (familyBaseline.reduce((a, b) => a + b.totalViolations, 0) / familyBaseline.length || 0).toFixed(2),
            meanViolationsMutated: (familyMutated.reduce((a, b) => a + b.totalViolations, 0) / familyMutated.length || 0).toFixed(2),
            meanCriticalMutated: (familyMutated.reduce((a, b) => a + b.criticalViolations, 0) / familyMutated.length || 0).toFixed(2),
            meanImpactedNodesMutated: (familyMutated.reduce((a, b) => a + b.impactedNodes, 0) / familyMutated.length || 0).toFixed(2)
        };
    });
    writeCsv(path.join(outputDir, 'accessibility_summary.csv'), a11ySummary);

    // 7. aggregate_report.json
    const report = {
        generatedAt: new Date().toISOString(),
        summaryByFamily,
        summaryByFamilyCategory,
        failureDistribution: failureDist,
        accessibility: a11ySummary
    };
    fs.writeFileSync(path.join(outputDir, 'aggregate_report.json'), JSON.stringify(report, null, 2));

    console.log(`Aggregation complete. Results written to ${outputDir}`);
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: npx ts-node src/murun/runner/aggregate.ts <input_dir> <output_dir>');
    process.exit(1);
}

const inputDir = path.resolve(args[0]);
const outputDir = path.resolve(args[1]);

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
