import { test, expect } from '@playwright/test';
import { MutantGenerator } from '../src/benchmark/runner/MutantGenerator';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Baseline Collection and Scenario Generation', () => {
    
    test('should collect reachable targets and generate sampled scenarios', async ({ page }) => {
        await page.goto('/');
        
        const generator = new MutantGenerator(page);
        
        // 1. Baseline Run (collect reachable targets)
        const targets = await generator.collectReachableTargets({
            scenarioId: 'baseline-collection',
            scenarioCategory: 'exploratory',
            sourceSpec: 'tests/BaselineCollection.spec.ts',
            viewContext: 'home',
        });
        console.log(`Collected ${targets.length} reachable targets.`);
        expect(targets.length).toBeGreaterThan(0);
        
        // Verify fingerprint of a known element (e.g., the header)
        const headerTarget = targets.find(t => t.fingerprint.tagType === 'h1');
        expect(headerTarget).toBeDefined();
        console.log('Header Target Fingerprint:', JSON.stringify(headerTarget?.fingerprint, null, 2));
        
        // 2. Construct Scenarios
        const allScenarios = await generator.constructScenarios(targets);
        console.log(`Constructed ${allScenarios.length} total mutation scenarios.`);
        expect(allScenarios.length).toBeGreaterThan(0);
        
        // 3. Deterministic Sampling
        const budget = 10;
        const seed = 12345;
        const sampledScenarios = generator.sampleScenarios(allScenarios, budget, seed);
        
        console.log(`Sampleed ${sampledScenarios.length} scenarios with budget ${budget} and seed ${seed}.`);
        expect(sampledScenarios.length).toBe(budget);
        
        // 4. Save Scenarios
        const scenarioFile = path.join(__dirname, '../mutations/react-todo-scenarios.json');
        generator.saveScenarios(scenarioFile, sampledScenarios);
        console.log(`Saved scenarios to ${scenarioFile}`);
        expect(fs.existsSync(scenarioFile)).toBe(true);

        // Verify determinism by sampling again with same seed
        const sampledScenarios2 = generator.sampleScenarios(allScenarios, budget, seed);
        expect(sampledScenarios2).toEqual(sampledScenarios);
        console.log('Sampling is deterministic.');
    });
});
