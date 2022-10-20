import fs from "fs";
import path from "path";
import { $, cd } from "zx";

export default async function main(vite) {
  cd(vite.root);
  if (fs.existsSync(path.join(vite.root, ".git"))) {
    await $`git add -A`;
  }

  let pkgJSON = JSON.parse(fs.readFileSync(path.join(vite.root, "package.json")).toString());

  pkgJSON.devDependencies = {
    ...pkgJSON.devDependencies,
    playwright: "1.19.2",
    "@playwright/test": "^1.18.1",
    "npm-run-all": "latest",
    "start-server-and-test": "latest",
    "cross-env": "latest"
  };

  pkgJSON.scripts = {
    ...pkgJSON.scripts,
    "start-server-and-test": "start-server-and-test build-and-start http://localhost:3000 test:e2e",
    "build-and-start": "npm run build && npm run start",
    "test:e2e": "npm-run-all -p test:e2e:*",
    "test:e2e:js": "playwright test e2e/*.mjs",
    "test:e2e:no-js": "cross-env DISABLE_JAVASCRIPT=true playwright test e2e/*.mjs"
  };

  fs.writeFileSync(path.join(vite.root, "package.json"), JSON.stringify(pkgJSON, null, 2));

  fs.mkdirSync(path.join(vite.root, "e2e"), { recursive: true });
  let specPath = path.join(vite.root, "e2e", "index.spec.mjs");
  fs.writeFileSync(
    specPath,
    `
  import { test, expect } from "@playwright/test";

  test("basic login test", async ({ browser }) => {
    let appURL = new URL(process.env.TEST_HOST ?? "http://localhost:3000/").href;
    const context = await browser.newContext({
      javaScriptEnabled: !process.env.DISABLE_JAVASCRIPT
    });
  
    const page = await context.newPage();
  
    // go to home
    await page.goto(appURL);
    expect(page.url()).toBe(appURL);
  });
`
  );
  // fs.writeFileSync(path.resolve(vite.root, vitep), config);
  await $`npx prettier -w ${specPath}`;

  // let newConfig = config.replace(
  // fs.writeFileSync(path.join(vite.root, "postcss.config.cjs"), postcssConfig);
  // fs.writeFileSync(path.join(vite.root, "src", "tailwind.css"), tailwindCSS);
  // let root = path.join(vite.root, "src", "root.tsx");
  // fs.writeFileSync(
  //   root,
  //   fs.readFileSync(root).toString().replace("import", 'import "./tailwind.css";\nimport')
  // );

  await $`npx @antfu/ni`;
  await $`npx playwright install`;
}
