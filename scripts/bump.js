import { exec, spawnSync } from "child_process";
import { defineCommand, runMain } from "citty";
import glob from "fast-glob";
import fs from "fs/promises";
import { promisify } from "util";

const command = defineCommand({
  args: {
    vinxi: {
      description: "Bump vinxi packages to latest version",
    }
  },
  async run({ args }) {
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

    await Promise.all(glob.globSync(["package.json", "packages/*/package.json", "examples/*/package.json"])
      .map(async path => {
        const packageJson = JSON.parse(await fs.readFile(path));
        let deps = packages;
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
