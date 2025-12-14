import * as fs from "node:fs/promises";
import * as path from "node:path";
import glob from "fast-glob";

const files = await glob("**/*.{js,css}", { cwd: `${process.cwd()}/src` });

await Promise.all(
  files.map(file =>
    fs.cp(
      path.join(import.meta.dirname, "../src", file),
      path.join(import.meta.dirname, "../dist", file),
      { recursive: true },
    ),
  ),
);
