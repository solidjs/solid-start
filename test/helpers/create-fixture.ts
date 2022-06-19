import path from "path";
import fse from "fs-extra";
import type { Writable } from "stream";
// import express from "express";
import getPort from "get-port";
import stripIndent from "strip-indent";
import c from "picocolors";
import { fileURLToPath } from "url";
import { spawn, sync as spawnSync } from "cross-spawn";
import { Readable } from "stream";

import fs from "fs";
import polka from "polka";
import { dirname, join } from "path";
import sirv from "sirv";
import { once } from "events";

import "solid-start/runtime/node-globals.js";
import { createRequest } from "solid-start/runtime/fetch.js";

import prepareManifest from "solid-start/runtime/prepareManifest.js";
import type { RequestContext } from "solid-start/server/types.js";

const TMP_DIR = path.join(
  path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url)))),
  ".tmp"
);

interface FixtureInit {
  buildStdio?: Writable;
  sourcemap?: boolean;
  files: { [filename: string]: string };
  template?: "cf-template" | "deno-template" | "node-template";
  setup?: "node" | "cloudflare";
}

interface EntryServer {
  default: (request: RequestContext) => Promise<Response>;
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>;
export type AppFixture = Awaited<ReturnType<typeof createAppFixture>>;

export const js = String.raw;
export const mdx = String.raw;
export const css = String.raw;
export function json(value: object) {
  return JSON.stringify(value, null, 2);
}

export async function createFixture(init: FixtureInit) {
  let projectDir = await createFixtureProject(init);
  let buildPath = path.resolve(projectDir, ".solid", "server", "entry-server.js");
  if (!fse.existsSync(buildPath)) {
    throw new Error(
      c.red(
        `Expected build directory to exist at ${c.dim(
          buildPath
        )}. The build probably failed. Did you maybe have a syntax error in your test code strings?`
      )
    );
  }
  let app: EntryServer = await import(buildPath);
  let manifest = fse.readJSONSync(path.resolve(projectDir, "dist", "public", "rmanifest.json"));
  let assetManifest = fse.readJSONSync(path.resolve(projectDir, "dist", "public", "manifest.json"));

  prepareManifest(manifest, assetManifest);

  let handler = async (request: Request) => {
    return await app.default({
      request: request,
      responseHeaders: new Headers(),
      manifest
    });
  };

  let requestDocument = async (href: string, init?: RequestInit) => {
    let url = new URL(href, "test://test");
    let request = new Request(url, init);
    return await handler(request);
  };

  let requestData = async (href: string, routeId: string, init?: RequestInit) => {
    let url = new URL(href, "test://test");
    url.searchParams.set("_data", routeId);
    let request = new Request(url, init);
    return await handler(request);
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
    return fse.readFile(path.join(projectDir, "public", asset.replace(/^\//, "")), "utf8");
  };

  return {
    projectDir,
    build: app,
    requestDocument,
    requestData,
    postDocument,
    getBrowserAsset,
    manifest
  };
}

export async function createAppFixture(fixture: Fixture) {
  let startAppServer = async (): Promise<{
    port: number;
    stop: () => Promise<void>;
  }> => {
    return new Promise(async (accept, reject) => {
      let port = await getPort();
      const noop_handler = (_req, _res, next) => next();
      const paths = {
        assets: path.join(fixture.projectDir, "dist", "public")
      };

      const assets_handler = fs.existsSync(paths.assets)
        ? sirv(paths.assets, {
            maxAge: 31536000,
            immutable: true
          })
        : noop_handler;

      const render = async (req, res, next) => {
        if (req.url === "/favicon.ico") return;

        const webRes = await fixture.build.default({
          request: createRequest(req),
          responseHeaders: new Headers(),
          manifest: fixture.manifest
        });

        res.statusCode = webRes.status;
        res.statusMessage = webRes.statusText;

        for (const [name, value] of webRes.headers) {
          res.setHeader(name, value);
        }

        if (webRes.body) {
          const readable = Readable.from(webRes.body as any);
          readable.pipe(res);
          await once(readable, "end");
        } else {
          res.end();
        }
      };

      const app = polka().use("/", assets_handler).use(render);

      // app.all(
      //   "*",
      //   createExpressHandler({ build: fixture.build, mode: "production" })
      // );

      let stop = (): Promise<void> => {
        return new Promise((res, rej) => {
          app.server.close(err => {
            if (err) {
              rej(err);
            } else {
              res();
            }
          });
        });
      };

      app.listen(port, () => {
        accept({ stop, port });
      });
    });
  };

  let start = async () => {
    let { stop, port } = await startAppServer();

    let serverUrl = `http://localhost:${port}`;

    return {
      serverUrl,
      /**
       * Shuts down the fixture app, **you need to call this
       * at the end of a test** or `afterAll` if the fixture is initialized in a
       * `beforeAll` block. Also make sure to `await app.close()` or else you'll
       * have memory leaks.
       */
      close: async () => {
        return stop();
      }
    };
  };

  return start();
}

////////////////////////////////////////////////////////////////////////////////
export async function createFixtureProject(init: FixtureInit): Promise<string> {
  let template = init.template ?? "node-template";
  let dirname = path.dirname(path.dirname(path.join(fileURLToPath(import.meta.url))));
  let integrationTemplateDir = path.join(dirname, template);
  let projectName = `remix-${template}-${Math.random().toString(32).slice(2)}`;
  let projectDir = path.join(TMP_DIR, projectName);
  console.log(
    dirname,
    projectDir,
    integrationTemplateDir,
    path.join(new URL(import.meta.url).pathname, ".."),
    new URL(import.meta.url).pathname,
    fileURLToPath(import.meta.url)
  );

  await fse.ensureDir(projectDir);
  await fse.copy(integrationTemplateDir, projectDir);

  // await fse.copy(
  //   path.join(dirname, "../../build/node_modules"),
  //   path.join(projectDir, "node_modules"),
  //   { overwrite: true }
  // );
  if (init.setup) {
    spawnSync("node", ["node_modules/@remix-run/dev/cli.js", "setup", init.setup], {
      cwd: projectDir
    });
  }
  await writeTestFiles(init, projectDir);
  await build(projectDir, init.buildStdio, init.sourcemap);

  return projectDir;
}

async function build(projectDir: string, buildStdio?: Writable, sourcemap?: boolean) {
  // let buildArgs = ["node_modules/@remix-run/dev/cli.js", "build"];
  // if (sourcemap) {
  //   buildArgs.push("--sourcemap");
  // }
  let proc = spawnSync("node", ["node_modules/solid-start/bin.cjs", "build"], {
    cwd: projectDir
  });
  console.log(proc.stdout.toString());
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
