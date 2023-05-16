import { test } from "@playwright/test";
import spawn, { sync as spawnSync } from "cross-spawn";
import fse from "fs-extra";
import { readFile } from "fs/promises";
import getPort from "get-port";
import path from "path";
import c from "picocolors";
import stripIndent from "strip-indent";
import { fileURLToPath } from "url";
import waitOn from "wait-on";

import "solid-start/node/globals.js";

const TMP_DIR = path.join(
  path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url)))),
  ".tmp"
);

interface FixtureInit {
  csr?: boolean;
  buildStdio?: boolean;
  sourcemap?: boolean;
  files: { [filename: string]: string };
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>;
export type AppFixture = Awaited<ReturnType<Awaited<ReturnType<typeof createFixture>>["createServer"]>>;

export const js = String.raw;
export const mdx = String.raw;
export const css = String.raw;
export function json(value: object) {
  return JSON.stringify(value, null, 2);
}

export async function createFixture(init: FixtureInit) {
  let projectDir = await createFixtureProject(init);
  let buildPath = path.resolve(projectDir, "dist", "server", "entry.mjs");
  const isCSR = init.csr;
  if (!fse.existsSync(buildPath)) {
    throw new Error(
      c.red(
        `Expected build directory to exist at ${c.dim(
          buildPath
        )}. The build probably failed. Did you maybe have a syntax error in your test code strings?`
      )
    );
  }

  let ip = "localhost";
  let port = await getPort();
  let proc = spawn("npm", ["run", "start"], {
    cwd: projectDir,
    env: {
      ...process.env,
      PORT: `${port}`,
      IP: ip
    }
  });

  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);

  await waitOn({
    resources: [`http://${ip}:${port}/favicon.ico`],
    validateStatus: function (status) {
      return status >= 200 && status < 310; // default if not provided
    }
  });

  let getStaticHTML = async () => {
    let text = await readFile(
      path.join(projectDir, "dist", "client", "index.html"),
      "utf8"
    );
    return new Response(text, {
      headers: {
        "content-type": "text/html"
      }
    });
  }

  let requestDocument = async (href: string, init?: RequestInit) => {
    if (isCSR && !href.startsWith("/api") && !href.includes(".")) {
      return await getStaticHTML();
    }
    let url = new URL(href, `http://${ip}:${port}`);
    let request = new Request(url, init);
    try {
      return await fetch(request)
    } catch (err) {
      console.error(err);
    }
  };

  let postDocument = async (href: string, data: URLSearchParams | FormData) => {
    return await requestDocument(href, {
      method: "POST",
      body: data,
      headers: {
        "Content-Type":
          data instanceof URLSearchParams
            ? "application/x-www-form-urlencoded"
            : "multipart/form-data"
      }
    });
  };

  let getBrowserAsset = async (asset: string) => {
    return await fse.readFile(path.join(projectDir, "public", asset.replace(/^\//, "")), "utf8");
  };

  return {
    projectDir,
    requestDocument,
    postDocument,
    getBrowserAsset,
    createServer: async () => {
      return {
        serverUrl: `http://${ip}:${port}`,
        close: async () => {
          proc.kill();
        }
      };
    }
  };
}

////////////////////////////////////////////////////////////////////////////////
export async function createFixtureProject(init: FixtureInit): Promise<string> {
  let template = "template";
  let dirname = path.dirname(path.dirname(path.join(fileURLToPath(import.meta.url))));
  let info = test.info();
  let pName = info.titlePath
    .slice(1, info.titlePath.length - 1)
    .map(s => s.replace(/ /g, "-"))
    .join("-");
  let integrationTemplateDir = path.join(dirname, template);
  test;
  let projectName = `${pName}-${Math.random().toString(32).slice(2)}`;
  let projectDir = path.join(TMP_DIR, projectName);

  await fse.ensureDir(projectDir);
  await fse.copy(integrationTemplateDir, projectDir);

  await writeTestFiles(init, projectDir);
  await build(projectDir, init.buildStdio);

  return projectDir;
}

function build(
  projectDir: string,
  buildStdio?: boolean
) {
  let proc = spawnSync("npm", ["run", "build"], {
    cwd: projectDir
  });

  if (proc.error) {
    console.error(proc.error);
  }

  if (buildStdio) {
    console.log(proc.stdout.toString());
  }
  console.error(proc.stderr.toString());
}

async function writeTestFiles(init: FixtureInit, dir: string) {
  await Promise.all(
    Object.keys(init.files).map(async filename => {
      let filePath = path.join(dir, filename);
      await fse.ensureDir(path.dirname(filePath));
      await fse.writeFile(filePath, stripIndent(init.files[filename]));
    })
  );
}
