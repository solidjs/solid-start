import { exec, spawnSync } from "child_process";
import { defineCommand, runMain } from "citty";
import glob from "fast-glob";
import fs from "fs/promises";
import semver from 'semver';
import { promisify } from "util";

const command = defineCommand({
  args: {
    version: {
      type: "positional",
      description: "solid-start version to set (Must be a valid SemVer)",
      required: true
    },
    vinxi: {
      description: "Bump vinxi packages to latest version",
    }
  },
  async run({ args }) {
    if(!semver.valid(args.version)) {
      console.error(`Invalid SemVer version provided: "${args.version}". Please provide a valid SemVer version as the second argument`);
      process.exit(1);
    }

    const extPackageNames = ["solid-js"];

    if (args.vinxi) {
      extPackageNames.push(...[
        "vinxi",
        "@vinxi/plugin-directives",
        "@vinxi/server-components",
        "@vinxi/server-functions",
        "@vinxi/plugin-mdx"
      ]);
    }

    const execAsync = promisify(exec);
    const packages = await Promise.all(extPackageNames.map(async name => {
      const proc = await execAsync(`npm view ${name} version`);
      return { name, version: proc.stdout.toString().trim() };
    }));

    const startPackages = await Promise.all(
      glob.globSync("packages/*/package.json").map(async path => {
        const packageJson = JSON.parse(await fs.readFile(path));
        packageJson.version = args.version;
        await fs.writeFile(path, JSON.stringify(packageJson, null, 2) + "\n");
        return { name: packageJson.name, version: args.version };
      }
    ));
    
    packages.push(...startPackages);

    await Promise.all(glob.globSync(["package.json", "packages/*/package.json", "examples/*/package.json"])
      .map(async path => {
        const packageJson = JSON.parse(await fs.readFile(path));
        let deps = packages;
        if (packageJson.name === "solid-start-monorepo") {
          deps = deps.filter(dep => !startPackages.find(pkg => pkg.name === dep.name))
        }
        for (const dep of deps) {
          packageJson.dependencies?.[dep.name] && (packageJson.dependencies[dep.name] = `^${dep.version}`);
          packageJson.devDependencies?.[dep.name] && (packageJson.devDependencies[dep.name] = `^${dep.version}`);
        }
        await fs.writeFile(path, JSON.stringify(packageJson, null, 2) + "\n");
      })
    );

    console.log("Updating lock file...\n");
    spawnSync("pnpm i", { shell: true, stdio: "inherit" });
  }
});

runMain(command);
