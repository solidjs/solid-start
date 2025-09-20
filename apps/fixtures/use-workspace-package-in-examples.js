import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const examplesDir = join(__dirname, '../examples');
// Get all directories in examples folder
const examples = readdirSync(examplesDir)
  .filter(file => statSync(join(examplesDir, file)).isDirectory());

// Process each example's package.json
for (const example of examples) {
  const packagePath = join(examplesDir, example, 'package.json');

  if (existsSync(packagePath)) {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

    if (packageJson.dependencies?.['@solidjs/start']) {
      packageJson.dependencies['@solidjs/start'] = 'file:../../packages/start';

      writeFileSync(
        packagePath,
        `${JSON.stringify(packageJson, null, 2)}\n`,
        'utf8'
      );

      console.log(`Updated ${packagePath}`);
    }
  }
}
