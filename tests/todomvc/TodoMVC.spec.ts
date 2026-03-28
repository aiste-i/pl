import { test, expect } from '../baseFixture';
import { STRATEGIES, StrategyName } from '../../src/locators';
import { MutantGenerator } from '../../src/murun/runner/MutantGenerator';
import * as path from 'path';
import * as fs from 'fs';

const APP_NAME = 'todomvc';
const SCENARIO_FILE = path.join(process.cwd(), 'test-results', APP_NAME, 'scenarios.json');

/**
 * Shared Test Logic
 */
const runSuite = (strategy: StrategyName) => {
    test('should add a todo item', async ({ page, locators, oracle }) => {
        await page.goto('/');

        const input = locators.addTodo();
        const oracleInput = oracle.addTodo();

        // Enforced instrumentation via wrappers
        await oracleInput.precheckVisible();
        await input.fill('Buy Milk');
        await input.press('Enter');

        await oracle.itemByText('Buy Milk').assertVisible();
    });

    test('should toggle a todo item', async ({ page, locators, oracle }) => {
        await page.goto('/');

        const input = locators.addTodo();
        await input.fill('Buy Eggs');
        await input.press('Enter');

        const checkbox = locators.toggleCheckbox();
        const oracleItem = oracle.itemByText('Buy Eggs');
        const oracleCheckbox = oracle.toggleCheckbox(oracleItem.raw); // Allow raw for composition but action is instrumented

        await oracleCheckbox.precheckVisible();
        await checkbox.check();

        await oracleItem.assertClass(/completed/);
    });
};

/**
 * 1. BASELINE RUNS
 */
for (const strategy of STRATEGIES) {
    test.describe(`TodoMVC Baseline [${strategy}] @app:${APP_NAME}`, () => {
        test.use({ locatorStrategy: strategy });
        runSuite(strategy);
    });
}

/**
 * 2. MUTATION RUNS
 */
if (fs.existsSync(SCENARIO_FILE)) {
    const generator = new MutantGenerator(null as any, APP_NAME);
    const scenarios = generator.loadScenarios(SCENARIO_FILE).slice(0, 5);

    for (const scenario of scenarios) {
        for (const strategy of STRATEGIES) {
            test.describe(`TodoMVC Mutation: ${scenario.operator.constructor.name} [${strategy}] @app:${APP_NAME}`, () => {
                test.use({ 
                    locatorStrategy: strategy,
                    mutation: scenario 
                });
                runSuite(strategy);
            });
        }
    }
}
