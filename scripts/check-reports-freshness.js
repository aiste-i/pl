const { execSync } = require('child_process');

const commands = [
  'npm run benchmark:coverage:realworld',
  'npx ts-node --transpile-only scripts/generate-realworld-corpus-report.ts',
  'npx ts-node --transpile-only scripts/generate-operator-reports.ts',
  'npx ts-node --transpile-only scripts/generate-pipeline-verification.ts',
];

for (const command of commands) {
  execSync(command, { stdio: 'inherit' });
}

execSync('git diff --exit-code -- reports', { stdio: 'inherit' });
