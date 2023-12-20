import { test } from "@playwright/test";
import spawn, { sync as spawnSync } from "cross-spawn";
import fse from "fs-extra";
import { readFile } from "fs/promises";
import getPort from "get-port";
import path from "path";
import c from "picocolors";
import stripIndent from "strip-indent";
import { fileURLToPath, pathToFileURL } from "url";
import waitOn from "wait-on";

import { createServer } from "solid-start-node/server.js";
import "solid-start/node/globals.js";
import type { FetchEvent } from "solid-start/server/types.js";

const TMP_DIR = path.join(
  path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url)))),
  ".tmp"
);

interface FixtureInit {
  buildStdio?: boolean;
  sourcemap?: boolean;
  files: { [filename: string]: string };
}

interface EntryServer {
  default: (request: FetchEvent) => Promise<Response>;
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>;
export type AppFixture = Awaited<ReturnType<typeof createTestServer>>;

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

  let manifest = fse.readJSONSync(
    path.resolve(projectDir, "dist", "public", "route-manifest.json")
  );

  if (process.env.START_ADAPTER !== "solid-start-node") {
    let ip = process.env.START_ADAPTER === "solid-start-deno" ? "127.0.0.1" : "localhost";
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

    let requestDocument = async (href: string, init?: RequestInit) => {
      let url = new URL(href, `http://${ip}:${port}`);
      let request = new Request(url, init);
      return await fetch(request);
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
      manifest,
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

  let app: EntryServer = await import(pathToFileURL(buildPath).toString());

  let handler = async (request: Request) => {
    const env = {
      manifest,
      getStaticHTML: async assetPath => {
        let text = await readFile(
          path.join(projectDir, "dist", "public", assetPath + ".html"),
          "utf8"
        );
        return new Response(text, {
          headers: {
            "content-type": "text/html"
          }
        });
      }
    };

    function internalFetch(route, init = {}) {
      if (route.startsWith("http")) {
        return fetch(route, init);
      }

      let url = new URL(route, "http://internal");
      const request = new Request(url.href, init);
      return app.default({
        request: request,
        env,
        fetch: internalFetch
      });
    }

    return await app.default({
      request: request,
      env,
      fetch: internalFetch
    });
  };

  let requestDocument = async (href: string, init?: RequestInit) => {
    let url = new URL(href, "test://test");
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
    return await fse.readFile(path.join(projectDir, "public", asset.replace(/^\//, "")), "utf8");
  };

  return {
    projectDir,
    build: app,
    requestDocument,
    postDocument,
    getBrowserAsset,
    manifest,
    createServer: () =>
      createTestServer({
        projectDir,
        build: app,
        manifest
      })
  };
}

export async function createTestServer(fixture: { projectDir: string; manifest: any; build }) {
  let startServer = async (): Promise<{
    port: number;
    stop: () => Promise<void>;
  }> => {
    return new Promise(async (accept, reject) => {
      let port = await getPort();

      const paths = {
        assets: path.join(fixture.projectDir, "dist", "public")
      };

      let app = createServer({
        paths,
        env: { manifest: fixture.manifest },
        handler: fixture.build.default
      });

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
    let { stop, port } = await startServer();

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
        return await stop();
      }
    };
  };

  return await start();
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

  // if (init.setup) {
  //   spawnSync("node", ["node_modules/@remix-run/dev/cli.js", "setup", init.setup], {
  //     cwd: projectDir
  //   });
  // }
  await writeTestFiles(init, projectDir);
  await build(projectDir, init.buildStdio);

  return projectDir;
}

function build(
  projectDir: string,
  buildStdio?: boolean,
  adapter: string | undefined = process.env.START_ADAPTER
) {
  // let buildArgs = ["node_modules/@remix-run/dev/cli.js", "build"];
  // if (sourcemap) {
  //   buildArgs.push("--sourcemap");
  // }
  let proc = spawnSync("node", ["node_modules/solid-start/bin.cjs", "build"], {
    cwd: projectDir,
    env: {
      ...process.env,
      START_ADAPTER: adapter ? adapter : "solid-start-node"
    }
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
