import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ServerResponse } from "node:http";
import type { Connect } from "vite";

import {
  HMR_RECOVERY_SCRIPT,
  inspectWriteHead,
  hmrRecoveryMiddleware,
  isHtmlErrorResponse,
  isHtmlResponse,
  resolvePreviewServerEntry,
} from "./dev-server.ts";

const temporaryDirectories: string[] = [];

function createServerEntry(extension: "js" | "mjs") {
  const root = mkdtempSync(join(tmpdir(), "solid-start-preview-"));
  const serverDirectory = join(root, "dist/server");
  const serverEntry = join(serverDirectory, `entry-server.${extension}`);

  temporaryDirectories.push(root);
  mkdirSync(serverDirectory, { recursive: true });
  writeFileSync(serverEntry, "export default {};");

  return { root, serverEntry };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true });
  }
});

describe("resolvePreviewServerEntry", () => {
  it.each(["js", "mjs"] as const)("finds the generated .%s entry", extension => {
    const { root, serverEntry } = createServerEntry(extension);

    expect(resolvePreviewServerEntry(root)).toBe(serverEntry);
  });

  it("throws when the server entry has not been built", () => {
    const root = mkdtempSync(join(tmpdir(), "solid-start-preview-"));
    temporaryDirectories.push(root);

    expect(() => resolvePreviewServerEntry(root)).toThrow(
      `Could not find the SolidStart server entry in ${join(root, "dist/server")}`,
    );
  });
});

describe("isHtmlResponse", () => {
  it("recognizes HTML responses with content type parameters", () => {
    const response = new Response(null, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });

    expect(isHtmlResponse(response)).toBe(true);
  });

  it.each(["video/mp4", "application/json"])(
    "does not identify %s responses as HTML",
    contentType => {
      const response = new Response(null, { headers: { "content-type": contentType } });

      expect(isHtmlResponse(response)).toBe(false);
    },
  );

  it("does not identify a response without a content type as HTML", () => {
    expect(isHtmlResponse(new Response())).toBe(false);
  });
});

describe("isHtmlErrorResponse", () => {
  it("recognizes an HTML server error", () => {
    expect(isHtmlErrorResponse(500, "text/html; charset=utf-8")).toBe(true);
  });

  it.each([
    [200, "text/html"],
    [404, "text/html"],
    [500, "application/json"],
    [500, undefined],
  ])("ignores %i %s", (status, contentType) => {
    expect(isHtmlErrorResponse(status, contentType)).toBe(false);
  });
});

describe("inspectWriteHead", () => {
  it("reads the content type from headers given as an object", () => {
    const args = [500, "Internal Server Error", { "Content-Type": "text/html" }];

    expect(inspectWriteHead(args).contentType).toBe("text/html");
  });

  it("reads the content type from headers given as a flat array", () => {
    const args = [500, ["content-length", "12", "content-type", "text/html"]];

    expect(inspectWriteHead(args).contentType).toBe("text/html");
  });

  it("does not mistake the status message for headers", () => {
    expect(inspectWriteHead([500, "content-type"]).contentType).toBeUndefined();
  });

  it("removes the length from an object without touching the rest", () => {
    const args = [500, "OK", { "Content-Length": "12", "Content-Type": "text/html" }];

    expect(inspectWriteHead(args).withoutContentLength).toEqual([
      500,
      "OK",
      { "Content-Type": "text/html" },
    ]);
  });

  it("removes the length and its value from a flat array", () => {
    const args = [500, ["content-length", "12", "content-type", "text/html"]];

    expect(inspectWriteHead(args).withoutContentLength).toEqual([
      500,
      ["content-type", "text/html"],
    ]);
  });

  it("leaves arguments that carry no headers alone", () => {
    expect(inspectWriteHead([500]).withoutContentLength).toEqual([500]);
  });
});

describe("hmrRecoveryMiddleware", () => {
  function collect(chunk: string | ArrayBufferView) {
    return typeof chunk === "string"
      ? Buffer.from(chunk, "utf8")
      : Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  }

  function createResponse() {
    const headers = new Map<string, unknown>();
    const chunks: Array<Buffer> = [];
    const response = {
      statusCode: 200,
      writeHeadArgs: undefined as Array<unknown> | undefined,
      getHeader: (name: string) => headers.get(name.toLowerCase()),
      setHeader(name: string, value: unknown) {
        headers.set(name.toLowerCase(), value);
        return response;
      },
      headersSent: false,
      removeHeader(name: string) {
        headers.delete(name.toLowerCase());
      },
      writeHead(...args: Array<unknown>) {
        response.writeHeadArgs = args;
        response.headersSent = true;
        return response;
      },
      write(chunk: string | ArrayBufferView) {
        chunks.push(collect(chunk));
        response.headersSent = true;
        return true;
      },
      end(chunk?: unknown) {
        // Deliberately does not go through `write`: the real `end` writes to the socket directly,
        // and delegating would feed the chunk straight back into the middleware's wrapper.
        if (typeof chunk === "string" || ArrayBuffer.isView(chunk)) chunks.push(collect(chunk));
        response.headersSent = true;
        return response;
      },
      get body() {
        return Buffer.concat(chunks).toString("utf8");
      },
    };

    return response;
  }

  function run(response: ReturnType<typeof createResponse>, accept = "text/html") {
    const next = vi.fn();
    hmrRecoveryMiddleware(
      { headers: { accept } } as Connect.IncomingMessage,
      response as unknown as ServerResponse,
      next as unknown as Connect.NextFunction,
    );

    return next;
  }

  it("appends the recovery script to an HTML server error", () => {
    const response = createResponse();
    run(response);

    const page = "<html><head></head><body>boom</body></html>";
    response.writeHead(500, "Internal Server Error", [
      "content-length",
      String(page.length),
      "content-type",
      "text/html; charset=utf-8",
    ]);
    response.end(new TextEncoder().encode(page));

    expect(response.body).toBe(page + HMR_RECOVERY_SCRIPT);
  });

  it("drops the announced length so the longer body can go out chunked", () => {
    const response = createResponse();
    run(response);

    response.writeHead(500, "Internal Server Error", [
      "content-length",
      "42",
      "content-type",
      "text/html; charset=utf-8",
    ]);
    response.end("<html></html>");

    expect(response.writeHeadArgs).toEqual([
      500,
      "Internal Server Error",
      ["content-type", "text/html; charset=utf-8"],
    ]);
  });

  it("removes a length set without writeHead before the headers go out", () => {
    const response = createResponse();
    run(response);

    response.statusCode = 500;
    response.setHeader("content-type", "text/html");
    response.setHeader("content-length", "13");
    response.end("<html></html>");

    expect(response.getHeader("content-length")).toBeUndefined();
    expect(response.body).toBe("<html></html>" + HMR_RECOVERY_SCRIPT);
  });

  it("streams a body written across several chunks straight through", () => {
    const response = createResponse();
    run(response);

    response.writeHead(500, { "content-type": "text/html" });
    response.write("<html><head></head><body>");
    response.write("boom");
    response.end("</body></html>");

    expect(response.body).toBe("<html><head></head><body>boom</body></html>" + HMR_RECOVERY_SCRIPT);
  });

  it("leaves a successful page untouched", () => {
    const response = createResponse();
    run(response);

    response.writeHead(200, { "content-type": "text/html" });
    response.end("<html><head></head><body>fine</body></html>");

    expect(response.body).toBe("<html><head></head><body>fine</body></html>");
    expect(response.getHeader("content-length")).toBeUndefined();
  });

  it("leaves a non-HTML server error untouched", () => {
    const response = createResponse();
    run(response);

    response.writeHead(500, { "content-type": "application/json" });
    response.end(`{"error":true}`);

    expect(response.body).toBe(`{"error":true}`);
  });

  it("skips requests that do not accept HTML", () => {
    const response = createResponse();
    const next = run(response, "application/json");

    expect(next).toHaveBeenCalled();

    response.writeHead(500, { "content-type": "text/html" });
    response.end("<html><head></head></html>");

    expect(response.body).toBe("<html><head></head></html>");
  });
});
