import fs from 'fs';
import path from 'path';
import { REALWORLD_APP_IDS } from '../src/apps';
import { REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID } from '../src/benchmark/realworld-corpus';
import { aggregate, loadResults } from '../src/benchmark/runner/aggregate';

function main() {
  const inputDirs = REALWORLD_APP_IDS
    .map(appId => path.join(process.cwd(), 'test-results', appId, REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID, 'benchmark-runs'))
    .filter(inputDir => fs.existsSync(inputDir));
  const outputDir = path.join(
    process.cwd(),
    'test-results',
    REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID,
    'combined-aggregate',
  );

  if (inputDirs.length === 0) {
    throw new Error(`No supplementary semantic benchmark-runs directories found for ${REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID}.`);
  }

  const runs = inputDirs.flatMap(inputDir => loadResults(inputDir));
  const supplementRuns = runs.filter(run => run.corpusId === REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID);

  if (supplementRuns.length === 0) {
    throw new Error(`No ${REALWORLD_SEMANTIC_SUPPLEMENT_CORPUS_ID} runs found in: ${inputDirs.join(', ')}`);
  }

  aggregate(supplementRuns, outputDir);
  console.log(`Combined semantic supplement aggregate written to ${outputDir}`);
}

main();
