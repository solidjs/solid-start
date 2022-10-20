import fs from "fs";
import path from "path";
import { $, cd } from "zx";

let fixJestDom = `import fs from 'fs';
import path from 'path';

const typesPath = path.resolve('node_modules', '@types', 'testing-library__jest-dom', 'index.d.ts');
const refMatcher = /[\\r\\n]+\\/\\/\\/ <reference types="jest" \\/>/;

fs.readFile(typesPath, 'utf8', (err, data) => {
    if (err) throw err;

    fs.writeFile(
        typesPath,
        data.replace(refMatcher, ''),
        'utf8',
        function(err) {
            if (err) throw err;
        }
    );
});
`;

export default async function main(vite) {
  cd(vite.root);
  if (fs.existsSync(path.join(vite.root, ".git"))) {
    await $`git add -A`;
  }

  let pkgJSON = JSON.parse(fs.readFileSync(path.join(vite.root, "package.json")).toString());

  pkgJSON.devDependencies = {
    ...pkgJSON.devDependencies,
    "@testing-library/jest-dom": "^5.16.2",
    "@types/testing-library__jest-dom": "^5.14.3",
    "solid-testing-library": "^0.3.0",
    jsdom: "^19.0.0",
    vitest: "^0.6.1"
  };

  pkgJSON.scripts = {
    ...pkgJSON.scripts,
    postinstall: "node ./fix-jest-dom.mjs",
    "test:unit": "vitest"
  };

  fs.writeFileSync(path.join(vite.root, "package.json"), JSON.stringify(pkgJSON, null, 2));
  fs.writeFileSync(
    path.join(vite.root, "setupVitest.ts"),
    `import '@testing-library/jest-dom';
  `
  );
  fs.writeFileSync(path.join(vite.root, "fix-jest-dom.mjs"), fixJestDom);

  let config, vitep;
  for (var vitePath of ["vite.config.js", "vite.config.ts"]) {
    console.log(path.resolve(vite.root, vitePath));
    if (fs.existsSync(path.resolve(vite.root, vitePath))) {
      console.log("here", vitePath);
      vitep = vitePath;
      config = fs.readFileSync(path.resolve(vite.root, vitePath)).toString();
    }
  }

  if (!config) {
    console.error("Could not find vite.config");
    return;
  }

  config = config.replace(
    `plugins: [`,
    `test: {
      exclude: ["node_modules", "e2e"],
      globals: true,
      setupFiles: process.env.TEST_ENV === 'server' ? undefined : './setupVitest.ts',
      environment: "jsdom",
      transformMode:
        process.env.TEST_ENV === "server"
          ? {
              ssr: [/.[tj]sx?$/]
            }
          : {
              web: [/.[tj]sx?$/]
            },
      // solid needs to be inline to work around
      // a resolution issue in vitest:
      deps: {
        inline: [/solid-js/]
      }
      // if you have few tests, try commenting one
      // or both out to improve performance:
      // threads: false,
      // isolate: false,
      },
      build: {
        target: "esnext",
        polyfillDynamicImport: false
      },
      resolve: {
        conditions: process.env.TEST_ENV === "server" ? [] : ["development", "browser"]
      },
      plugins: [`
  );

  console.log(config);

  fs.writeFileSync(path.resolve(vite.root, vitep), config);
  await $`npx prettier -w ${vitep}`;

  await $`npx @antfu/ni`;
}
