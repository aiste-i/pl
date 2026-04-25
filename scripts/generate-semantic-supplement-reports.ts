import fs from 'fs';
import path from 'path';
import { REALWORLD_APP_IDS } from '../src/apps';
import {
  REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST,
  getSemanticSupplementExcludedPairs,
  getSemanticSupplementScenarioEntries,
} from '../src/benchmark/realworld-corpus';

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function writeMarkdown(filePath: string, lines: string[]): void {
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

function main() {
  const reportsDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const scenarios = getSemanticSupplementScenarioEntries();
  const excludedPairs = getSemanticSupplementExcludedPairs();
  const titleOmissionRationale =
    scenarios.find(scenario => scenario.getByTitleOmissionRationale)?.getByTitleOmissionRationale ??
    'No stable natural getByTitle target was identified during the RealWorld semantic-target audit.';

  const scenarioRows = scenarios.map(scenario => ({
    scenarioId: scenario.scenarioId,
    displayName: scenario.displayName,
    supportedApps: scenario.supportedApps,
    excludedApps: scenario.excludedApps,
    targetLogicalKeys: scenario.targetLogicalKeys,
    intendedSemanticEntryPoint: scenario.intendedSemanticEntryPoint,
    fallbackPolicy: scenario.fallbackPolicy,
    targetInteractionOrAssertion: scenario.reason,
    semanticNaturalnessRationale: scenario.semanticNaturalnessRationale,
    supplementaryOnlyRationale: scenario.supplementRationale,
  }));

  const queryDistribution = scenarios.reduce((acc, scenario) => {
    acc[scenario.intendedSemanticEntryPoint] = (acc[scenario.intendedSemanticEntryPoint] ?? 0) + scenario.supportedApps.length;
    return acc;
  }, {
    getByRole: 0,
    getByLabel: 0,
    getByText: 0,
    getByPlaceholder: 0,
    getByAltText: 0,
    getByTitle: 0,
  } as Record<string, number>);

  const audit = {
    generatedAt: new Date().toISOString(),
    corpusId: REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST.corpusId,
    corpusRole: REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST.corpusRole,
    purpose: 'supplementary-semantic-query-coverage',
    primaryCorpusUnchanged: true,
    notPooledIntoPrimaryDenominators: true,
    auditedApps: REALWORLD_APP_IDS,
    titleLocatorDecision: {
      included: false,
      rationale: titleOmissionRationale,
    },
    scenarios: scenarioRows,
    excludedPairs,
    queryDistributionBySupportedAppScenarioPair: queryDistribution,
  };

  const corpus = {
    corpusId: REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST.corpusId,
    displayName: REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST.displayName,
    corpusRole: REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST.corpusRole,
    entrySpec: REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST.entrySpec,
    validationFiles: REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST.validationFiles,
    interpretationBoundary: REALWORLD_SEMANTIC_SUPPLEMENT_MANIFEST.interpretationBoundary,
    scenarioCount: scenarios.length,
    scenarios: scenarioRows,
    exclusionPolicy: 'Unsupported app/scenario pairs are reported and not executed; intended semantic strategies do not silently fall back to getByRole.',
    denominatorPolicy: 'Supplementary semantic results are stored and aggregated separately from realworld-active and are not pooled into primary thesis denominators.',
  };

  const markdownRows = [
    '# RealWorld Semantic Target Audit',
    '',
    'This audit defines a small supplementary semantic-coverage corpus. It is not part of the primary `realworld-active` denominator.',
    '',
    '| Scenario | Apps | Intended Query | Target | Rationale |',
    '| --- | --- | --- | --- | --- |',
    ...scenarios.map(scenario => [
      `\`${scenario.scenarioId}\``,
      scenario.supportedApps.map(app => `\`${app}\``).join(', '),
      `\`${scenario.intendedSemanticEntryPoint}\``,
      scenario.targetLogicalKeys.map(key => `\`${key}\``).join(', '),
      scenario.semanticNaturalnessRationale.replace(/\|/g, '\\|'),
    ].join(' | ')).map(row => `| ${row} |`),
    '',
    '## Exclusions',
    '',
    ...excludedPairs.map(pair => `- \`${pair.scenarioId}\` excludes \`${pair.appId}\`: ${pair.reason}`),
    '',
    '## getByTitle Decision',
    '',
    titleOmissionRationale,
  ];

  const note = [
    '# Thesis Note: Supplementary RealWorld Semantic Sub-Corpus',
    '',
    'The primary RealWorld corpus remains unchanged and continues to define the main thesis benchmark denominator.',
    '',
    'The supplementary `realworld-semantic-supplement` corpus was added because the audited primary corpus naturally overrepresented `getByRole()` within the semantic-first family. The supplement broadens empirical coverage of Playwright built-in user-facing locators without rebalancing or redefining the primary dataset.',
    '',
    'The supplement is small, explicit, and methodologically isolated. It exercises `getByLabel()`, `getByText()`, `getByPlaceholder()`, and `getByAltText()` only where those contracts are naturally present in the RealWorld applications. `getByTitle()` is omitted because no stable, natural title-driven target was found.',
    '',
    'Suggested thesis wording:',
    '',
    '> The primary corpus reflects realistic dominant semantic usage in the audited RealWorld applications, while a small supplementary semantic-coverage corpus was added to observe additional built-in locator strategies that were underrepresented in the main dataset.',
  ];

  writeJson(path.join(reportsDir, 'realworld-semantic-target-audit.json'), audit);
  writeMarkdown(path.join(reportsDir, 'realworld-semantic-target-audit.md'), markdownRows);
  writeJson(path.join(reportsDir, 'realworld-semantic-supplement-corpus.json'), corpus);
  writeMarkdown(path.join(reportsDir, 'realworld-semantic-supplement-note.md'), note);
}

main();
