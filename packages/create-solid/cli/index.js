import fs from "fs";
import parser from "gitignore-parser";
import { bold, cyan, gray, green, red } from "kleur/colors";
import path from "path";
import prompts from "prompts/lib/index";
import glob from "tiny-glob/sync.js";
import { viaContentsApi } from "./github.js";
import { version } from "../package.json";
import degit from "degit";

const gitIgnore = `
dist
worker
.solid
.output
.vercel
.netlify

# dependencies
/node_modules

# IDEs and editors
/.idea
.project
.classpath
*.launch
.settings/

# Temp
gitignore

# System Files
.DS_Store
Thumbs.db
`;

const disclaimer = `
Welcome to the SolidStart setup wizard!

There are definitely bugs and some feature might not work yet.
If you encounter an issue, have a look at https://github.com/solidjs/solid-start/issues and open a new one, if it is not already tracked.
`;

function mkdirp(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    if (e.code === "EEXIST") return;
    throw e;
  }
}

async function main() {
  console.log(gray(`\ncreate-solid version ${version}`));
  console.log(red(disclaimer));

  const target = process.argv[2] || ".";

  let templates = new Set();
  const templateDirs = await viaContentsApi({
    directory: "examples",
    repository: "solid-start",
    user: "solidjs",
    ref: "main"
  });

  console.log(
    templateDirs.forEach(dir => {
      templates.add(dir.replace("examples/", "").replace(/-ts/, ""));
    })
  );

  let templateNames = [...templates];
  const templateName = (
    await prompts({
      type: "select",
      name: "template",
      message: "Which template do you want to use?",
      choices: templateNames.map(name => ({ title: name, value: name })),
      initial: 1
    })
  ).template;

  let ts_response = false;

  if (templateDirs.find(dir => dir.includes(templateName + "-ts"))) {
    if (templateDirs.find(dir => dir === "examples/" + templateName)) {
      ts_response = (
        await prompts({
          type: "confirm",
          name: "value",
          message: "Use TypeScript?",
          initial: false
        })
      ).value;
    } else {
      ts_response = true;
    }
  }

  if (fs.existsSync(target)) {
    if (fs.readdirSync(target).length > 0) {
      const response = await prompts({
        type: "confirm",
        name: "value",
        message: "Directory not empty. Continue?",
        initial: false
      });

      if (!response.value) {
        process.exit(1);
      }
    }
  } else {
    mkdirp(target);
  }

  let tempTemplate = path.join(target, ".solid-start");

  await new Promise((res, rej) => {
    const emitter = degit(
      "solidjs/solid-start/examples/" + templateName + (ts_response ? "-ts" : "") + "#main",
      {
        cache: false,
        force: true,
        verbose: true
      }
    );

    emitter.on("info", info => {
      console.log(info.message);
    });

    emitter.clone(path.join(process.cwd(), tempTemplate)).then(() => {
      res({});
    });
  });

  const templateDir = path.join(process.cwd(), tempTemplate);
  const gitignore_contents = gitIgnore;
  const gitignore = parser.compile(gitignore_contents);

  const files = glob("**/*", { cwd: templateDir }).filter(gitignore.accepts);

  files.forEach(file => {
    const src = path.join(templateDir, file);
    const dest = path.join(target, file);

    if (fs.statSync(src).isDirectory()) {
      mkdirp(dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  });

  fs.writeFileSync(path.join(target, ".gitignore"), gitignore_contents);

  const name = path.basename(path.resolve(target));

  fs.rmSync(path.join(process.cwd(), tempTemplate), {
    recursive: true,
    force: true
  });

  const pkg_file = path.join(target, "package.json");
  const pkg_json = fs
    .readFileSync(pkg_file, "utf-8")
    .replace(/"name": ".+"/, _m => `"name": "${name}"`)
    .replace(/"(.+)": "workspace:.+"/g, (_m, name) => `"${name}": "next"`); // TODO ^${versions[name]}

  fs.writeFileSync(pkg_file, pkg_json);

  console.log(bold(green("✔ Copied project files")));

  console.log("\nNext steps:");
  let i = 1;

  const relative = path.relative(process.cwd(), target);
  if (relative !== "") {
    console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
  }

  console.log(`  ${i++}: ${bold(cyan("npm install"))} (or pnpm install, or yarn)`);
  console.log(`  ${i++}: ${bold(cyan("npm run dev -- --open"))}`);

  console.log(`\nTo close the dev server, hit ${bold(cyan("Ctrl-C"))}`);
}

main();
