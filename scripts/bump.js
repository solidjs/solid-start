import { execSync, spawnSync } from "child_process";
import glob from "fast-glob";
import fs from "fs/promises";
import semver from 'semver';

const version = process.argv[2];

if (!version || version === "") {
  console.log("Please provide a version as the second argument");
  process.exit(1);
}

if (!semver.valid(version)) {
  console.error(`Invalid SemVer version provided: "${version}". Please provide a valid SemVer version as the second argument`);
  process.exit(1);
}

let solidJsVersion = execSync("npm view solid-js version").toString().trim();

const packages = await glob("packages/*/package.json");
const packageNames = await Promise.all(packages.map(async packagePath => {
  const packageJson = JSON.parse(await fs.readFile(packagePath));
  packageJson.version = version;
  await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
  return packageJson.name
}));

const examples = await glob("examples/*/package.json");
await Promise.all(examples.map(async packagePath => {
  const packageJson = JSON.parse(await fs.readFile(packagePath));
    
  packageNames.forEach(packageName => {
    packageJson.dependencies?.[packageName] && (packageJson.dependencies[packageName] = `^${version}`);
    packageJson.devDependencies?.[packageName] && (packageJson.devDependencies[packageName] = `^${version}`);
  });

  packageJson.dependencies?.["solid-js"] && (packageJson.dependencies["solid-js"] = `^${solidJsVersion}`);
  packageJson.devDependencies?.["solid-js"] && (packageJson.devDependencies["solid-js"] = `^${solidJsVersion}`);
  
  await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
}));

console.log("Updating lock file...")
spawnSync("pnpm i", { shell: true, stdio: "inherit" });
