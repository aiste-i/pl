import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { REALWORLD_APP_IDS, getAppAdapter } from '../../src/apps';
import { getActiveLogicalKeys } from '../../src/benchmark/realworld-corpus';
import { STRATEGIES } from '../../src/locators';
import {
  ALLOWED_SEMANTIC_ENTRY_POINTS,
  getByLogicalKey,
  getLocatorMeta,
  type LocatorFamilyMeta,
} from '../../src/locators/apps/shared-realworld';

const ORACLE_FAMILY = 'oracle';

function getRawLocatorTree(appId: (typeof REALWORLD_APP_IDS)[number], family: (typeof STRATEGIES)[number] | typeof ORACLE_FAMILY) {
  const adapter = getAppAdapter(appId);
  return family === ORACLE_FAMILY ? adapter.getOracle() : adapter.getLocators(family);
}

function getMetaOrThrow(appId: string, family: string, logicalKey: string): LocatorFamilyMeta {
  const locatorFactory = getByLogicalKey(getRawLocatorTree(appId as any, family as any), logicalKey);
  expect(typeof locatorFactory, `${appId} ${family} ${logicalKey} is missing`).toBe('function');
  const meta = getLocatorMeta(locatorFactory);
  expect(meta, `${appId} ${family} ${logicalKey} is missing family metadata`).toBeTruthy();
  return meta!;
}

test('app locator modules are app-owned and do not import the shared benchmark factory', async () => {
  const appModules = [
    'src/locators/apps/angular-realworld.locators.ts',
    'src/locators/apps/react-realworld.locators.ts',
    'src/locators/apps/vue3-realworld.locators.ts',
  ];

  for (const relativePath of appModules) {
    const absolutePath = path.join(process.cwd(), relativePath);
    const contents = fs.readFileSync(absolutePath, 'utf8');
    expect(contents.includes('createSharedRealWorldLocators')).toBe(false);
    expect(contents.includes('createSharedRealWorldOracle')).toBe(false);
  }
});

test('active logical locator functions expose complete metadata for benchmark families and oracle', async () => {
  const activeKeys = getActiveLogicalKeys();

  for (const appId of REALWORLD_APP_IDS) {
    for (const family of [...STRATEGIES, ORACLE_FAMILY] as const) {
      for (const logicalKey of activeKeys) {
        const meta = getMetaOrThrow(appId, family, logicalKey);
        expect(meta.family).toBe(family);
        expect(meta.appId).toBe(appId);
        expect(meta.logicalKey).toBe(logicalKey);
        expect(meta.moduleId).toContain(`${appId === 'realworld' ? 'react' : appId.startsWith('angular') ? 'angular' : 'vue3'}-realworld.locators.ts`);

        if (family === 'semantic-first') {
          expect(['semantic-native', 'semantic-css-exception']).toContain(meta.sourceKind);
          if (meta.sourceKind === 'semantic-native') {
            expect(meta.purity).toBe('semantic');
            expect(ALLOWED_SEMANTIC_ENTRY_POINTS).toContain(meta.semanticEntryPoint as any);
            expect(meta.isException).toBe(false);
          } else {
            expect(meta.purity).toBe('css');
            expect(meta.isException).toBe(true);
            expect(meta.exception).toBeTruthy();
          }
        } else if (family === 'oracle') {
          expect(meta.sourceKind).toBe('oracle');
          expect(meta.purity).toBe('oracle');
          expect(meta.selector).toMatch(/^getByTestId\('/);
        } else {
          expect(meta.sourceKind).toBe(family);
          expect(meta.purity).toBe(family);
          expect(meta.isException).toBe(false);
        }
      }
    }
  }
});

test('implemented css and xpath locator selectors never use data-testid, and oracle roots stay on getByTestId', async () => {
  for (const appId of REALWORLD_APP_IDS) {
    for (const family of [...STRATEGIES, ORACLE_FAMILY] as const) {
      const tree = getRawLocatorTree(appId, family);
      for (const logicalKey of getActiveLogicalKeys()) {
        const meta = getLocatorMeta(getByLogicalKey(tree, logicalKey));
        if (!meta?.selector) {
          continue;
        }

        if (family === 'css' || family === 'xpath') {
          expect(meta.selector).not.toContain('data-testid');
        }

        if (family === ORACLE_FAMILY) {
          expect(meta.rootKind).toBe('getByTestId');
          expect(meta.selector).toMatch(/^getByTestId\('/);
        }
      }
    }
  }
});

test('semantic-first entries only use page.locator when they are explicit css-backed exceptions', async () => {
  for (const appId of REALWORLD_APP_IDS) {
    const tree = getRawLocatorTree(appId, 'semantic-first');
    for (const logicalKey of getActiveLogicalKeys()) {
      const meta = getLocatorMeta(getByLogicalKey(tree, logicalKey));
      expect(meta, `${appId} semantic-first ${logicalKey} is missing`).toBeTruthy();

      if (meta?.rootKind === 'page.locator') {
        expect(meta.sourceKind).toBe('semantic-css-exception');
        expect(meta.isException).toBe(true);
      } else {
        expect(meta?.sourceKind).toBe('semantic-native');
      }
    }
  }
});

test('active benchmark scenario files stay on the logical locator interface for benchmark interactions', async () => {
  const files = [
    'tests/realworld/benchmark-active.scenarios.ts',
    'tests/realworld/helpers/benchmark-active.ts',
  ];
  const forbiddenPatterns = [
    'page.locator(',
    'page.getByRole(',
    'page.getByText(',
    'page.getByPlaceholder(',
    'page.getByLabel(',
    'page.getByAltText(',
    'page.getByTitle(',
    'page.getByTestId(',
  ];

  for (const relativePath of files) {
    const contents = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
    for (const pattern of forbiddenPatterns) {
      expect(contents.includes(pattern), `${relativePath} should not bypass the logical locator interface with ${pattern}`).toBe(false);
    }
  }
});
