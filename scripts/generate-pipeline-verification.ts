import fs from 'fs';
import path from 'path';

function main() {
  const reportsDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  const workflowFiles = [
    '.github/workflows/pr-realworld.yml',
    '.github/workflows/scheduled-realworld.yml',
  ];

  const report = {
    corpusId: 'realworld-active',
    primaryEnvironment: {
      browser: 'chromium',
      os: 'ubuntu-latest',
      role: 'primary-thesis-environment',
    },
    supplementaryEnvironment: {
      browsers: ['firefox', 'webkit'],
      role: 'supplementary-smoke-regression-evidence',
    },
    commands: {
      lint: packageJson.scripts?.lint ?? null,
      typecheck: packageJson.scripts?.typecheck ?? null,
      validation: packageJson.scripts?.['validate:realworld'] ?? null,
      reportsGenerateSource: packageJson.scripts?.['reports:generate:source'] ?? null,
      reportsGenerateRun: packageJson.scripts?.['reports:generate:run'] ?? null,
      reportsGenerate: packageJson.scripts?.['reports:generate'] ?? null,
      reportsCheckSource: packageJson.scripts?.['reports:check:source'] ?? null,
      reportsCheck: packageJson.scripts?.['reports:check'] ?? null,
      baselineChromium: packageJson.scripts?.['benchmark:baseline:all'] ?? null,
      baselineCrossBrowserSmoke: packageJson.scripts?.['benchmark:baseline:smoke:all'] ?? null,
      mutationPrepareApp: packageJson.scripts?.['benchmark:prepare:app'] ?? null,
      mutationSelected: packageJson.scripts?.['benchmark:mutate:all'] ?? null,
      mutationSample: packageJson.scripts?.['benchmark:mutate:sample:all'] ?? null,
      aggregateAll: packageJson.scripts?.['benchmark:aggregate:all'] ?? null,
    },
    workflows: workflowFiles.map(relativePath => ({
      path: relativePath,
      present: fs.existsSync(path.join(process.cwd(), relativePath)),
    })),
    notes: [
      'Chromium remains the primary benchmark environment unless the thesis methodology is revised in parallel.',
      'Firefox and WebKit runs are tracked as supplementary smoke coverage and do not silently redefine the thesis dataset.',
      'Mutation-sample preparation and collection stay pinned to Chromium so the selected corpus is generated in the primary benchmark environment.',
      'Source-derived report freshness is enforced in PR validation, while run-derived summaries are regenerated from the currently available benchmark artifacts.',
    ],
  };

  fs.writeFileSync(
    path.join(reportsDir, 'realworld-pipeline-verification.json'),
    JSON.stringify(report, null, 2),
  );
}

main();
