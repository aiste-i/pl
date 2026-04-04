import { Page } from 'playwright';
import { MutationCandidate } from '../../webmutator/MutationCandidate';
import { DomOperators } from '../../webmutator/operators/DomOperators';
import { DomOperator } from '../../webmutator/operators/dom/DomOperator';
import { OperatorRegistry } from '../../webmutator/operators/OperatorRegistry';
import { OracleSafety } from '../../webmutator/utils/OracleSafety';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { getAppReachableTargetsPath } from '../../apps';
import { getBenchmarkCorpusId } from '../../benchmark/realworld-corpus';

export interface ReachableTargetContext {
    scenarioId: string;
    scenarioCategory: string;
    sourceSpec: string;
    viewContext: string;
    logicalKey?: string | null;
}

export interface ReachableTarget {
    applicationId: string;
    corpusId?: string;
    scenarioId: string;
    scenarioCategory: string;
    sourceSpec: string;
    viewContext: string;
    logicalKey?: string | null;
    url: string;
    selector: string;
    fingerprint: {
        role: string;
        name: string;
        tagType: string;
        stableAttributes: Record<string, string>;
    };
    oracleProtected: boolean;
    eligible: boolean;
    exclusionReason: string | null;
    eligibleOperators: string[];
    eligibleCategories: string[];
}

interface SavedTargetRegistry {
    metadata: {
        applicationId: string;
        corpusId?: string;
        generatedAt: string;
        totalTargets: number;
        activeScenarioIds: string[];
    };
    targets: ReachableTarget[];
}

interface SavedScenarioSet {
    metadata: {
        applicationId: string;
        corpusId?: string;
        generatedAt: string;
        totalCandidates: number;
        totalEligibleCandidates: number;
        budget: number;
        seed: number;
        categoryQuotas: Record<string, number>;
        selectedCounts: Record<string, number>;
        activeScenarioIds: string[];
    };
    scenarios: ReturnType<MutationCandidate['toJSON']>[];
}

export class MutantGenerator {
    private page: Page;
    private appName: string;
    private targetRegistry: Map<string, ReachableTarget> = new Map();
    private registryPath: string;
    private corpusId?: string;
    private lastSamplingSummary: SavedScenarioSet['metadata'] | null = null;

    constructor(page: Page, appName: string = 'default') {
        this.page = page;
        this.appName = appName;
        this.registryPath = getAppReachableTargetsPath(this.appName as any);
        this.corpusId = getBenchmarkCorpusId();
        this.loadRegistryFromFile();
    }

    private buildTargetRegistryKey(target: ReachableTarget): string {
        return [
            target.applicationId,
            target.corpusId ?? 'no-corpus',
            target.scenarioId,
            target.viewContext,
            target.url,
            target.selector,
        ].join('::');
    }

    private buildCandidateId(target: ReachableTarget, operator: DomOperator): string {
        return createHash('sha1')
            .update([
                target.applicationId,
                target.corpusId ?? 'no-corpus',
                target.scenarioId,
                target.viewContext,
                target.url,
                target.selector,
                operator.constructor.name,
            ].join('::'))
            .digest('hex');
    }

    private deterministicRank(seed: number, value: string): string {
        return createHash('sha1').update(`${seed}::${value}`).digest('hex');
    }

    private loadRegistryFromFile() {
        if (!fs.existsSync(this.registryPath)) {
            return;
        }

        try {
            const data = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
            const targets = Array.isArray(data) ? data : data.targets;
            for (const item of targets as ReachableTarget[]) {
                if (!item?.scenarioId || !item?.viewContext || !item?.applicationId) {
                    continue;
                }
                const key = this.buildTargetRegistryKey(item);
                this.targetRegistry.set(key, item);
            }
        } catch (e) {
            console.error('Failed to load target registry:', e);
        }
    }

    async saveRegistryToFile() {
        const dir = path.dirname(this.registryPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const targets = Array.from(this.targetRegistry.values());
        const payload: SavedTargetRegistry = {
            metadata: {
                applicationId: this.appName,
                corpusId: this.corpusId,
                generatedAt: new Date().toISOString(),
                totalTargets: targets.length,
                activeScenarioIds: [...new Set(targets.map(target => target.scenarioId).filter(Boolean))].sort(),
            },
            targets,
        };
        fs.writeFileSync(this.registryPath, JSON.stringify(payload, null, 2));
    }

    async collectReachableTargets(context: ReachableTargetContext): Promise<ReachableTarget[]> {
        if (!this.page) {
            throw new Error('collectReachableTargets requires an active Playwright page.');
        }

        const url = this.page.url();
        const foundTargets = await this.page.evaluate(() => {
            const getFingerprint = (element: Element) => {
                const attributes: Record<string, string> = {};
                const stableAttrNames = ['id', 'name', 'class', 'data-testid', 'role', 'type'];
                for (const name of stableAttrNames) {
                    const val = element.getAttribute(name);
                    if (val) attributes[name] = val;
                }

                return {
                    role: element.getAttribute('role') || '',
                    name: element.getAttribute('name') || '',
                    tagType: element.tagName.toLowerCase(),
                    stableAttributes: attributes
                };
            };

            const getSelector = (element: Element): string => {
                const testId = element.getAttribute('data-testid');
                if (testId) return `[data-testid="${testId}"]`;
                if (element.id) return `#${element.id}`;
                const path: string[] = [];
                let current: Element | null = element;
                while (current && current !== document.body) {
                    let selector = current.tagName.toLowerCase();
                    if (current.parentElement) {
                        const siblings = Array.from(current.parentElement.children).filter(e => e.tagName === current?.tagName);
                        if (siblings.length > 1) {
                            selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
                        }
                    }
                    path.unshift(selector);
                    current = current.parentElement;
                }
                return path.join(' > ');
            };

            const elements = Array.from(document.querySelectorAll('button, input, textarea, a, h1, h2, h3, p, div, span, li, label'));
            return elements
                .filter(el => {
                    const style = window.getComputedStyle(el);
                    const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
                    return isVisible;
                })
                .map(el => ({
                    selector: getSelector(el),
                    fingerprint: getFingerprint(el)
                }));
        });

        const operators = DomOperators.getDomOperators();

        for (const discovered of foundTargets) {
            const locator = this.page.locator(discovered.selector).first();
            if (await locator.count() === 0) {
                continue;
            }

            const oracleProtected = await OracleSafety.isProtected(locator);
            const eligibleOperators: string[] = [];
            const eligibleCategories = new Set<string>();

            if (!oracleProtected) {
                for (const operator of operators) {
                    try {
                        if (await operator.isApplicable(this.page, locator)) {
                            eligibleOperators.push(operator.constructor.name);
                            eligibleCategories.add(operator.category);
                        }
                    } catch {
                        // Ignore operator applicability errors during collection.
                    }
                }
            }

            const target: ReachableTarget = {
                applicationId: this.appName,
                corpusId: this.corpusId,
                scenarioId: context.scenarioId,
                scenarioCategory: context.scenarioCategory,
                sourceSpec: context.sourceSpec,
                viewContext: context.viewContext,
                logicalKey: context.logicalKey ?? null,
                url,
                selector: discovered.selector,
                fingerprint: discovered.fingerprint,
                oracleProtected,
                eligible: !oracleProtected && eligibleOperators.length > 0,
                exclusionReason: oracleProtected
                    ? 'oracle-protected'
                    : eligibleOperators.length === 0
                        ? 'no-applicable-operators'
                        : null,
                eligibleOperators,
                eligibleCategories: [...eligibleCategories].sort(),
            };

            const key = this.buildTargetRegistryKey(target);
            if (!this.targetRegistry.has(key)) {
                this.targetRegistry.set(key, target);
            }
        }

        return Array.from(this.targetRegistry.values());
    }

    async constructScenarios(targets: ReachableTarget[]): Promise<MutationCandidate[]> {
        const candidates: MutationCandidate[] = [];
        const candidateKeys = new Set<string>();

        for (const target of targets) {
            if (!target.eligible) {
                continue;
            }

            for (const operatorName of target.eligibleOperators) {
                const operator = OperatorRegistry.createOperator(operatorName);
                const candidate = new MutationCandidate(target.selector, operator, target.url, target.fingerprint, {
                    applicationId: target.applicationId,
                    corpusId: target.corpusId,
                    candidateId: this.buildCandidateId(target, operator),
                    scenarioId: target.scenarioId,
                    scenarioCategory: target.scenarioCategory,
                    sourceSpec: target.sourceSpec,
                    viewContext: target.viewContext,
                    logicalKey: target.logicalKey ?? null,
                    oracleProtected: target.oracleProtected,
                    eligible: target.eligible,
                    exclusionReason: target.exclusionReason,
                    eligibleOperators: target.eligibleOperators,
                    eligibleCategories: target.eligibleCategories,
                    quotaBucket: operator.category,
                    aggregateComparisonEligible: true,
                    comparisonExclusionReason: null,
                });

                if (!candidateKeys.has(candidate.candidateId!)) {
                    candidateKeys.add(candidate.candidateId!);
                    candidates.push(candidate);
                }
            }
        }

        return candidates;
    }

    async constructScenariosFromRegistry(): Promise<MutationCandidate[]> {
        const targets = Array.from(this.targetRegistry.values());
        return this.constructScenarios(targets);
    }

    saveScenarios(filePath: string, candidates: MutationCandidate[]) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const payload: SavedScenarioSet = {
            metadata: this.lastSamplingSummary ?? {
                applicationId: this.appName,
                corpusId: this.corpusId,
                generatedAt: new Date().toISOString(),
                totalCandidates: candidates.length,
                totalEligibleCandidates: candidates.length,
                budget: candidates.length,
                seed: 0,
                categoryQuotas: {},
                selectedCounts: {},
                activeScenarioIds: [...new Set(candidates.map(candidate => candidate.scenarioId).filter(Boolean) as string[])].sort(),
            },
            scenarios: candidates.map(candidate => candidate.toJSON()),
        };

        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    }

    loadScenarios(filePath: string): MutationCandidate[] {
        if (!fs.existsSync(filePath)) return [];
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const data = Array.isArray(raw) ? raw : raw.scenarios;
        return data.map((d: any) => {
            const operator = OperatorRegistry.createOperator(d.operator.type, d.operator.params);
            const candidate = new MutationCandidate(d.selector, operator, d.url, d.fingerprint, {
                applicationId: d.applicationId,
                corpusId: d.corpusId,
                candidateId: d.candidateId,
                scenarioId: d.scenarioId,
                scenarioCategory: d.scenarioCategory,
                sourceSpec: d.sourceSpec,
                viewContext: d.viewContext,
                logicalKey: d.logicalKey ?? null,
                oracleProtected: d.oracleProtected,
                eligible: d.eligible,
                exclusionReason: d.exclusionReason,
                eligibleOperators: d.eligibleOperators,
                eligibleCategories: d.eligibleCategories,
                quotaBucket: d.quotaBucket,
                selectionSeed: d.selectionSeed,
                aggregateComparisonEligible: d.aggregateComparisonEligible,
                comparisonExclusionReason: d.comparisonExclusionReason,
            });
            if (d.record) candidate.record = d.record;
            return candidate;
        });
    }

    sampleScenarios(candidates: MutationCandidate[], budget: number, seed: number): MutationCandidate[] {
        const categoryOrder: Array<DomOperator['category']> = ['structural', 'content', 'accessibility-semantic', 'visibility'];
        const eligibleCandidates = candidates.filter(candidate => candidate.eligible !== false && candidate.aggregateComparisonEligible !== false);
        const pools = new Map<DomOperator['category'], MutationCandidate[]>();

        for (const category of categoryOrder) {
            pools.set(
                category,
                eligibleCandidates
                    .filter(candidate => candidate.operator.category === category)
                    .sort((left, right) => this.deterministicRank(seed, left.candidateId || '').localeCompare(this.deterministicRank(seed, right.candidateId || ''))),
            );
        }

        const baseQuota = Math.floor(budget / categoryOrder.length);
        const remainder = budget % categoryOrder.length;
        const categoryQuotas = Object.fromEntries(
            categoryOrder.map((category, index) => [category, baseQuota + (index < remainder ? 1 : 0)])
        ) as Record<string, number>;

        const selected: MutationCandidate[] = [];
        const selectedCounts = Object.fromEntries(categoryOrder.map(category => [category, 0])) as Record<string, number>;
        let leftover = 0;

        for (const category of categoryOrder) {
            const pool = pools.get(category)!;
            const quota = categoryQuotas[category];
            const taken = pool.slice(0, quota);
            selected.push(...taken);
            selectedCounts[category] = taken.length;
            if (taken.length < quota) {
                leftover += quota - taken.length;
            }
        }

        if (leftover > 0) {
            for (const category of categoryOrder) {
                const pool = pools.get(category)!;
                while (leftover > 0 && selectedCounts[category] < pool.length) {
                    selected.push(pool[selectedCounts[category]]);
                    selectedCounts[category] += 1;
                    leftover -= 1;
                }
            }
        }

        const finalSelection = selected.slice(0, budget);
        for (const candidate of finalSelection) {
            candidate.selectionSeed = seed;
            candidate.quotaBucket = candidate.operator.category;
        }

        this.lastSamplingSummary = {
            applicationId: this.appName,
            corpusId: this.corpusId,
            generatedAt: new Date().toISOString(),
            totalCandidates: candidates.length,
            totalEligibleCandidates: eligibleCandidates.length,
            budget,
            seed,
            categoryQuotas,
            selectedCounts,
            activeScenarioIds: [...new Set(finalSelection.map(candidate => candidate.scenarioId).filter(Boolean) as string[])].sort(),
        };

        return finalSelection;
    }

    getSamplingSummary(): SavedScenarioSet['metadata'] | null {
        return this.lastSamplingSummary;
    }
}
