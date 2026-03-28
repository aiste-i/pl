import { Page } from 'playwright';
import { WebMutator } from '../../webmutator/WebMutator';
import { MutationCandidate } from '../../webmutator/MutationCandidate';
import { DomOperators } from '../../webmutator/operators/DomOperators';
import { DomOperator } from '../../webmutator/operators/dom/DomOperator';
import { OperatorRegistry } from '../../webmutator/operators/OperatorRegistry';
import { OracleSafety } from '../../webmutator/utils/OracleSafety';
import * as fs from 'fs';
import * as path from 'path';

export interface ReachableTarget {
    url: string;
    selector: string;
    fingerprint: {
        role: string;
        name: string;
        tagType: string;
        stableAttributes: Record<string, string>;
    };
}

export class MutantGenerator {
    private webMutator: WebMutator;
    private page: Page;
    private appName: string;
    private targetRegistry: Map<string, ReachableTarget> = new Map();
    private registryPath: string;

    constructor(page: Page, appName: string = 'default') {
        this.page = page;
        this.appName = appName;
        this.webMutator = new WebMutator();
        this.registryPath = path.join(process.cwd(), 'test-results', this.appName, 'reachable-targets.json');
        this.loadRegistryFromFile();
    }

    private loadRegistryFromFile() {
        if (fs.existsSync(this.registryPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
                for (const item of data) {
                    const key = `${item.url}|${item.selector}`;
                    this.targetRegistry.set(key, item);
                }
            } catch (e) {
                console.error('Failed to load target registry:', e);
            }
        }
    }

    async saveRegistryToFile() {
        const dir = path.dirname(this.registryPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        const data = Array.from(this.targetRegistry.values());
        fs.writeFileSync(this.registryPath, JSON.stringify(data, null, 2));
    }

    async collectReachableTargets(): Promise<ReachableTarget[]> {
        const url = this.page.url();
        const foundTargets = await this.page.evaluate(() => {
            const isOracleNodeOrContext = (el: Element): boolean => {
                if (el.hasAttribute('data-testid')) return true;
                if (el.querySelector('[data-testid]')) return true;
                return false;
            };

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

            const elements = Array.from(document.querySelectorAll('button, input, a, h1, h2, h3, p, div, span, li, label'));
            return elements.filter(el => {
                const style = window.getComputedStyle(el);
                const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
                return isVisible && !isOracleNodeOrContext(el);
            }).map(el => ({
                selector: getSelector(el),
                fingerprint: getFingerprint(el)
            }));
        });

        for (const t of foundTargets) {
            const target: ReachableTarget = { ...t, url };
            const key = `${url}|${target.selector}`;
            if (!this.targetRegistry.has(key)) {
                this.targetRegistry.set(key, target);
            }
        }

        return Array.from(this.targetRegistry.values());
    }

    async constructScenarios(targets: ReachableTarget[]): Promise<MutationCandidate[]> {
        const candidates: MutationCandidate[] = [];
        const operators = DomOperators.getDomOperators();

        for (const target of targets) {
            if (this.page) {
                const locator = this.page.locator(target.selector).first();
                if (await locator.count() === 0) continue;

                for (const operator of operators) {
                    try {
                        if (await operator.isApplicable(this.page, locator)) {
                            candidates.push(new MutationCandidate(target.selector, operator, target.url, target.fingerprint));
                        }
                    } catch (e) {}
                }
            } else {
                for (const operator of operators) {
                    candidates.push(new MutationCandidate(target.selector, operator, target.url, target.fingerprint));
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
        const data = candidates.map(c => c.toJSON());
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    loadScenarios(filePath: string): MutationCandidate[] {
        if (!fs.existsSync(filePath)) return [];
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return data.map((d: any) => {
            const operator = OperatorRegistry.createOperator(d.operator.type, d.operator.params);
            const candidate = new MutationCandidate(d.selector, operator, d.url, d.fingerprint);
            if (d.record) candidate.record = d.record;
            return candidate;
        });
    }

    sampleScenarios(candidates: MutationCandidate[], budget: number, seed: number): MutationCandidate[] {
        const sampled: MutationCandidate[] = [];
        const random = this.seededRandom(seed);
        const stratified: Record<string, MutationCandidate[]> = {};
        for (const c of candidates) {
            const opName = c.operator.constructor.name;
            if (!stratified[opName]) stratified[opName] = [];
            stratified[opName].push(c);
        }
        const opNames = Object.keys(stratified);
        this.deterministicShuffle(opNames, random);
        let currentOpIndex = 0;
        const activeOpNames = [...opNames];
        while (sampled.length < budget && activeOpNames.length > 0) {
            const opName = activeOpNames[currentOpIndex % activeOpNames.length];
            const pool = stratified[opName];
            if (pool.length > 0) {
                const index = Math.floor(random() * pool.length);
                sampled.push(pool.splice(index, 1)[0]);
                currentOpIndex++;
            } else {
                activeOpNames.splice(currentOpIndex % activeOpNames.length, 1);
            }
        }
        return sampled;
    }

    private deterministicShuffle(array: any[], random: () => number) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    private seededRandom(seed: number) {
        return function() {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };
    }
}
