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
  if (fs.existsSync(path.join(vite.root, ".git"))) {
    await $`git add -A`;
  }

  let pkgJSON = JSON.parse(fs.readFileSync(path.join(vite.root, "package.json")).toString());

  pkgJSON.devDependencies = {
    ...pkgJSON.devDependencies,
    tailwindcss: "*",
    autoprefixer: "*",
    postcss: "*"
  };

  fs.writeFileSync(path.join(vite.root, "package.json"), JSON.stringify(pkgJSON, null, 2));
  fs.writeFileSync(path.join(vite.root, "tailwind.config.cjs"), tailwindConfig);
  fs.writeFileSync(path.join(vite.root, "postcss.config.cjs"), postcssConfig);
  fs.writeFileSync(path.join(vite.root, "src", "tailwind.css"), tailwindCSS);
  let root = path.join(vite.root, "src", "root.tsx");
  fs.writeFileSync(
    root,
    fs.readFileSync(root).toString().replace("import", 'import "./tailwind.css";\nimport')
  );

  await $`npx @antfu/ni`;
}
