import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';
import {
  getActiveScenarioEntries,
  REALWORLD_CORPUS_MANIFEST,
} from '../../src/benchmark/realworld-corpus';

const DISALLOWED_PATTERNS = [
  /import\s+\{\s*test\s*,\s*expect\s*\}\s+from\s+['"]@playwright\/test['"]/,
  /page\.locator\(/,
  /page\.getBy(Role|Label|Text|Placeholder|AltText|Title)\(/,
  /page\.click\(/,
  /page\.fill\(/,
  /waitForSelector\(/,
];

test('benchmark-active corpus exposes a scenario-level manifest with active scenarios', async () => {
  const activeScenarios = getActiveScenarioEntries();
  expect(activeScenarios.length).toBeGreaterThanOrEqual(6);
  for (const scenario of activeScenarios) {
    expect(scenario.status).toBe('active');
    expect(scenario.logicalKeys.length).toBeGreaterThan(0);
  }
});

test('active corpus benchmark files are benchmark-fixture-driven and free of selector bypasses', async () => {
  for (const relativePath of REALWORLD_CORPUS_MANIFEST.validationFiles) {
    const content = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
    for (const pattern of DISALLOWED_PATTERNS) {
      expect(pattern.test(content), `Disallowed active-corpus pattern found in ${relativePath}: ${pattern}`).toBe(false);
    }
  }
});
