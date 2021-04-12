import { copyFileSync, readdirSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import renderStatic from "solid-start/renderStatic/index.js";
import vite from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getAllFiles(dirPath, pageRoot, arrayOfFiles) {
  const files = readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(file => {
    if (statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, pageRoot, arrayOfFiles);
    } else if (file.endsWith("sx") && !file.match(/\[.*\]/)) {
      arrayOfFiles.push(
        join(dirPath, "/", file)
          .replace(pageRoot, "")
          .replace(/(\/index)?(.jsx|.tsx)/, "") || "/"
      );
    }
  });

  return arrayOfFiles;
}

export function start() {
  const proc = spawn("npx", ["sirv-cli", "./dist", "--port", "3000"]);
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
}
export async function build(config) {
  await Promise.all([
    vite.build({
      build: {
        outDir: "./dist/"
      }
    }),
    vite.build({
      build: {
        ssr: `node_modules/solid-start/runtime/server/${"stringAsync"}/app.jsx`,
        outDir: "./.solid/server",
        rollupOptions: {
          output: {
            format: "esm"
          }
        }
      }
    })
  ]);
  const pathToServer = join(config.root, ".solid", "server", "index.js");
  copyFileSync(join(__dirname, "entry.js"), pathToServer);
  const pathToDist = resolve(config.root, "dist");
  const pageRoot = join(config.root, "src", "pages");
  const routes = [
    ...getAllFiles(pageRoot, pageRoot),
    ...(config.solidOptions.prerenderRoutes || [])
  ];
  renderStatic(
    routes.map(url => ({
      entry: pathToServer,
      output: join(pathToDist, url.length === 1 ? "index.html" : `${url.slice(1)}.html`),
      url
    }))
  );
}
