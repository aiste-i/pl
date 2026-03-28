import { MutantGenerator } from './MutantGenerator';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
    const appName = process.argv[2] || 'todomvc';
    const budget = parseInt(process.argv[3]) || 20;
    const seed = parseInt(process.argv[4]) || 12345;

    console.log(`Generating scenarios for app: ${appName} (budget: ${budget}, seed: ${seed})`);

    const generator = new MutantGenerator(null as any, appName);
    
    // 1. Construct all possible scenarios from registry
    const allScenarios = await generator.constructScenariosFromRegistry();
    console.log(`Constructed ${allScenarios.length} total scenarios.`);

    // 2. Sample
    const sampled = generator.sampleScenarios(allScenarios, budget, seed);
    console.log(`Sampled ${sampled.length} scenarios.`);

    // 3. Save
    const outputPath = path.join(process.cwd(), 'test-results', appName, 'scenarios.json');
    generator.saveScenarios(outputPath, sampled);
    console.log(`Saved scenarios to ${outputPath}`);
}

main().catch(console.error);
