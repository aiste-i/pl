import fs from 'fs';
import path from 'path';
import { getSourceSpecDispositions } from '../src/benchmark/realworld-corpus';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function verifyNoTemporaryDebt(): void {
  const sourceSpecs = getSourceSpecDispositions();
  assert(sourceSpecs.length > 0, 'Expected explicit source-spec dispositions.');
  for (const sourceSpec of sourceSpecs) {
    assert(
      ['migrated', 'excluded-by-design', 'excluded-methodological'].includes(sourceSpec.status),
      `Unexpected source-spec status for ${sourceSpec.sourceSpec}: ${sourceSpec.status}`,
    );
  }
}

function verifyOraclePurity(): void {
  const oracleModules = [
    'src/locators/apps/angular-realworld.locators.ts',
    'src/locators/apps/react-realworld.locators.ts',
    'src/locators/apps/vue3-realworld.locators.ts',
  ];
  const forbiddenPatterns = [
    '.filter(',
    'getByText(',
    'getByRole(',
    'getByLabel(',
    'getByPlaceholder(',
    'getByAltText(',
    'getByTitle(',
    '.locator(',
  ];

  for (const relativePath of oracleModules) {
    const contents = read(relativePath);
    const oracleStart = contents.lastIndexOf('export function get');
    assert(oracleStart >= 0, `Could not locate oracle section in ${relativePath}`);
    const oracleSection = contents.slice(oracleStart);
    for (const pattern of forbiddenPatterns) {
      assert(!oracleSection.includes(pattern), `${relativePath} oracle section contains forbidden pattern ${pattern}`);
    }
  }
}

function verifySemanticBestPractice(): void {
  const locatorModules = [
    'src/locators/apps/angular-realworld.locators.ts',
    'src/locators/apps/react-realworld.locators.ts',
    'src/locators/apps/vue3-realworld.locators.ts',
  ];
  const bannedPattern = ".getByRole('link')\n                .filter({ has: page.getByText(";

  for (const relativePath of locatorModules) {
    const contents = read(relativePath).replace(/\r\n/g, '\n');
    assert(!contents.includes(bannedPattern), `${relativePath} still uses role locator filtered by descendant text.`);
  }
}

verifyNoTemporaryDebt();
verifyOraclePurity();
verifySemanticBestPractice();
