import fs from "fs";
import path from "path";
import { $, cd } from "zx";

let tailwindConfig = `module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {}
  },
  plugins: []
};
`;

let postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

let tailwindCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

export default async function main(vite) {
  cd(vite.root);

  let pkgJSON = JSON.parse(fs.readFileSync(path.join(vite.root, "package.json")).toString());

  pkgJSON.devDependencies = {
    ...pkgJSON.devDependencies,
    "solid-mdx": "*",
    "@mdx-js/rollup": "*"
  };

  fs.writeFileSync(path.join(vite.root, "package.json"), JSON.stringify(pkgJSON, null, 2));
  // fs.writeFileSync(path.join(vite.root, "vite.config"), tailwindConfig);

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

  // replace solid() with solid({ extensions: [".mdx", ".md"] })
  config = config
    .replace(`solid({`, `solid({ extensions: [".mdx", ".md"], `)
    .replace(`solid()`, `solid({ extensions: [".mdx", ".md"] })`)
    .replace(
      `plugins: [`,
      `plugins: [
      {
        ...(await import("@mdx-js/rollup")).default({
          jsx: true,
          jsxImportSource: "solid-js",
          providerImportSource: "solid-mdx"
        }),
        enforce: "pre"
      },`
    );

  console.log(config);

  fs.writeFileSync(path.resolve(vite.root, vitep), config);

  // let newConfig = config.replace(
  // fs.writeFileSync(path.join(vite.root, "postcss.config.cjs"), postcssConfig);
  // fs.writeFileSync(path.join(vite.root, "src", "tailwind.css"), tailwindCSS);
  // let root = path.join(vite.root, "src", "root.tsx");
  // fs.writeFileSync(
  //   root,
  //   fs.readFileSync(root).toString().replace("import", 'import "./tailwind.css";\nimport')
  // );

  await $`npx @antfu/ni`;
  await $`npx prettier -w ${vitep}`;
}
