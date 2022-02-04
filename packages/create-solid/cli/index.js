import fs from "fs";
import parser from "gitignore-parser";
import { bold, cyan, gray, green, red } from "kleur/colors";
import path from "path";
import prompts from "prompts/lib/index";
import glob from "tiny-glob/sync.js";
import { version } from "../package.json";

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

  const ts_response = await prompts({
    type: "confirm",
    name: "value",
    message: "Use TypeScript?",
    initial: false
  });

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

  const cwd = path.join(__dirname, "templates/" + (ts_response.value ? "app-ts" : "app"));
  const gitignore_contents = fs.readFileSync(path.join(cwd, "gitignore"), "utf-8");
  const gitignore = parser.compile(gitignore_contents);

  const files = glob("**/*", { cwd }).filter(gitignore.accepts);

  files.forEach(file => {
    const src = path.join(cwd, file);
    const dest = path.join(target, file);

    if (fs.statSync(src).isDirectory()) {
      mkdirp(dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  });

  fs.writeFileSync(path.join(target, ".gitignore"), gitignore_contents);

  const name = path.basename(path.resolve(target));

  const pkg_file = path.join(target, "package.json");
  const pkg_json = fs
    .readFileSync(pkg_file, "utf-8")
    .replace("~TODO~", name)
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
