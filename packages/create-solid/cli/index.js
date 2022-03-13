import fs from "fs";
import parser from "gitignore-parser";
import { bold, cyan, gray, green, red } from "kleur/colors";
import path from "path";
import prompts from "prompts/lib/index";
import glob from "tiny-glob/sync.js";
import { viaContentsApi } from "./github.js";
import { version } from "../package.json";
import degit from "degit";
import { fetch } from "undici";
import { transform } from "sucrase";
import { transformSync } from "@babel/core";
import presetTypescript from "@babel/preset-typescript";
import pluginSyntaxJSX from "@babel/plugin-syntax-jsx";
import prettier from "prettier/esm/standalone.mjs";
import babel from "prettier/esm/parser-babel.mjs";

const gitIgnore = `
dist
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

  let config = {
    directory: "examples",
    repository: "solid-start",
    user: "solidjs",
    ref: "main"
  };

  let templates = {};
  const templateDirs = (await viaContentsApi(config)).filter(
    d => d !== config.directory + "/" + ".DS_Store"
  );

  const packageJsons = templateDirs.map(dir => {
    let url = `https://raw.githubusercontent.com/${config.user}/${config.repository}/${config.ref}/${dir}/package.json`;
    console.log(url);
    return fetch(url).then(s => s.json());
  });

  const packageJsonsMap = await Promise.all(packageJsons);
  console.log(packageJsonsMap);

  templateDirs.forEach(dir => {
    let template = dir.replace("examples/", "");
    // .replace(/-client-ts/, "")
    // .replace(/-client/, "")
    // .replace(/-ts/, "");
    if (!templates[template]) {
      templates[template] = {
        name: template,
        client: true,
        ssr: true,
        js: true,
        ts: true
      };
    }

    // if (dir.endsWith("-client") || dir.endsWith("-client-ts")) {
    //   templates[template].client = true;
    // } else {
    //   templates[template].ssr = true;
    // }

    // if (dir.endsWith("-ts")) {
    //   templates[template].ts = true;
    // } else {
    //   templates[template].js = true;
    // }
  });

  let templateNames = [...Object.values(templates)];

  const templateName = (
    await prompts({
      type: "select",
      name: "template",
      message: "Which template do you want to use?",
      choices: templateNames
        //   .filter(template => (ssr ? template.ssr : template.client))
        //   .filter(template => (ts_response ? template.ts : template.js))
        .map(template => ({ title: template.name, value: template.name })),
      initial: 0
    })
  ).template;

  if (!templateName) {
    throw new Error("No template selected");
  }

  let ssr = (
    await prompts({
      type: "confirm",
      name: "value",
      message: "Server Side Rendering?",
      initial: true
    })
  ).value;

  let ts_response = (
    await prompts({
      type: "confirm",
      name: "value",
      message: "Use TypeScript?",
      initial: false
    })
  ).value;

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
      `${config.user}/${config.repository}/${config.directory}/${
        templateName + (!ssr ? "-client" : "") + (ts_response ? "-ts" : "")
      }#${config.ref}`,
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
      if (src.includes("entry-server") && !ssr) {
        return;
      }
      if (!ts_response && (src.endsWith(".ts") || src.endsWith(".tsx"))) {
        let code = fs.readFileSync(src).toString();
        console.log(src);
        let compiledCode = transformSync(code, {
          // transforms: ["typescript", "jsx"],
          // disableESTransforms: true
          filename: dest,
          presets: [presetTypescript],
          plugins: [pluginSyntaxJSX]
        }).code;

        compiledCode = prettier.format(compiledCode, { parser: "babel", plugins: [babel] });

        fs.writeFileSync(dest.replace(".ts", ".js"), compiledCode);
      } else {
        fs.copyFileSync(src, dest);
      }
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

  if (!ssr) {
    fs.copyFileSync(
      path.join(__dirname, "../templates/client", "entry-client.tsx"),
      path.join(target, "src", "entry-client.tsx")
    );
  }

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
