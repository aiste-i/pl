import fs from 'fs';
import { test, expect } from '../baseFixture';
import { STRATEGIES, StrategyName } from '../../src/locators';
import { MutantGenerator } from '../../src/murun/runner/MutantGenerator';
import { getAppReachableTargetsPath, getAppScenariosPath, getSelectedAppId } from '../../src/apps';
import { getActiveScenarioDefinitions } from './benchmark-active.scenarios';

const APP_ID = getSelectedAppId();
const MODE = process.env.BENCHMARK_ACTIVE_MODE || 'baseline';
const SCENARIO_FILE = getAppScenariosPath(APP_ID);
const REACHABLE_TARGETS_FILE = getAppReachableTargetsPath(APP_ID);
const MUTATION_LIMIT = Number(process.env.MUTATION_LIMIT || process.env.npm_config_limit || Number.MAX_SAFE_INTEGER);
const ACTIVE_SCENARIOS = getActiveScenarioDefinitions();

function describeScenario(
  strategy: StrategyName,
  scenario: ReturnType<typeof getActiveScenarioDefinitions>[number],
  testTitle = `${scenario.displayName} [${strategy}]`,
) {
  test(testTitle, async ({ page, request, locators, oracle, appAdapter, applyDeferredMutation, setScenarioMetadata }) => {
    setScenarioMetadata({
      activeScenarioId: scenario.scenarioId,
      activeScenarioCategory: scenario.category,
      sourceSpec: scenario.sourceSpec,
    });
    await scenario.run({ page, request, locators, oracle, appAdapter, applyDeferredMutation });
  });
}

if (MODE === 'baseline') {
  for (const strategy of STRATEGIES) {
    test.describe(`RealWorld Active Baseline [${strategy}] @app:${APP_ID}`, () => {
      test.use({ locatorStrategy: strategy });
      for (const scenario of ACTIVE_SCENARIOS) {
        describeScenario(strategy, scenario);
      }
    });
  }
}

if (MODE === 'collect') {
  test.describe(`RealWorld Active Collection @app:${APP_ID}`, () => {
    for (const scenario of ACTIVE_SCENARIOS) {
      test(`collect reachable targets: ${scenario.displayName}`, async ({ page, request, locators, oracle, appAdapter, setScenarioMetadata }) => {
        setScenarioMetadata({
          activeScenarioId: scenario.scenarioId,
          activeScenarioCategory: scenario.category,
          sourceSpec: scenario.sourceSpec,
        });

        const generator = new MutantGenerator(page, APP_ID);
        await scenario.collect({
          page,
          request,
          locators,
          oracle,
          appAdapter,
          generator,
          async collectCheckpoint(viewContext: string) {
            await generator.collectReachableTargets({
              scenarioId: scenario.scenarioId,
              scenarioCategory: scenario.category,
              sourceSpec: scenario.sourceSpec,
              viewContext,
            });
          },
        });

        await generator.saveRegistryToFile();
        expect(fs.existsSync(REACHABLE_TARGETS_FILE)).toBe(true);
        const data = JSON.parse(fs.readFileSync(REACHABLE_TARGETS_FILE, 'utf8'));
        expect(Array.isArray(data.targets ?? data)).toBe(true);
      });
    }
  });
}

if (MODE === 'mutate' && fs.existsSync(SCENARIO_FILE)) {
  const generator = new MutantGenerator(null as any, APP_ID);
  const scenarios = generator.loadScenarios(SCENARIO_FILE).slice(0, MUTATION_LIMIT);

  for (const mutationScenario of scenarios) {
    const matchingScenario = ACTIVE_SCENARIOS.find(scenario => scenario.scenarioId === mutationScenario.scenarioId);
    if (!matchingScenario) {
      throw new Error(`Active mutation scenario ${mutationScenario.scenarioId} does not map to an active benchmark scenario.`);
    }

    for (const strategy of STRATEGIES) {
      test.describe(`RealWorld Active Mutation: ${mutationScenario.operator.constructor.name} [${strategy}] @app:${APP_ID}`, () => {
        test.use({
          locatorStrategy: strategy,
          mutation: mutationScenario,
        });

        describeScenario(
          strategy,
          matchingScenario,
          `${matchingScenario.displayName} [${strategy}] (${mutationScenario.scenarioId} :: ${mutationScenario.candidateId ?? mutationScenario.selector})`,
        );
      });
    }
  }
}
