const { execSync } = require('child_process');

const trackedSourceReports = [
  'reports/realworld-locator-support-matrix.json',
  'reports/realworld-locator-unsupported.json',
  'reports/realworld-semantic-css-exceptions.json',
  'reports/realworld-css-xpath-locator-audit.json',
  'reports/realworld-css-xpath-locator-audit.md',
  'reports/realworld-benchmark-corpus.json',
  'reports/realworld-migration-matrix.json',
  'reports/realworld-operator-taxonomy.json',
  'reports/realworld-pipeline-verification.json',
];

execSync('npm run reports:generate:source', { stdio: 'inherit' });

execSync(`git diff --exit-code -- ${trackedSourceReports.join(' ')}`, { stdio: 'inherit' });
