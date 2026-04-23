import { test, expect } from '@playwright/test';
import { MutantGenerator } from '../src/benchmark/runner/MutantGenerator';
import { WebMutator } from '../src/webmutator/WebMutator';
import * as path from 'path';

test.describe('Scenario Reuse', () => {
    
    test('should load and apply saved scenarios', async ({ page }) => {
        await page.goto('/');
        
        const generator = new MutantGenerator(page);
        const scenarioFile = path.join(__dirname, '../mutations/react-todo-scenarios.json');
        
        // 1. Load Scenarios
        const loadedScenarios = generator.loadScenarios(scenarioFile);
        console.log(`Loaded ${loadedScenarios.length} scenarios from ${scenarioFile}`);
        
        if (loadedScenarios.length === 0) {
            console.log('No scenarios found to reuse. Make sure BaselineCollection.spec.ts ran first.');
            return;
        }

        // 2. Apply a few loaded scenarios
        const mutator = new WebMutator();
        for (const scenario of loadedScenarios.slice(0, 3)) {
            console.log(`Applying scenario: ${scenario.operator.constructor.name} on ${scenario.selector}`);
            const record = await mutator.applyMutation(page, scenario.selector, scenario.operator);
            if (!record.success) {
                console.error(`Mutation failed: ${record.error}`);
            }
            expect(record.success).toBe(true);
        }
    });
});
