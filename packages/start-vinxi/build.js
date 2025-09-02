import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { glob } from "tinyglobby";

try {
  await rm("dist", { recursive: true });
} catch {}

const assets = await glob(`**/*.css`, { cwd: join(process.cwd(), "src") });

await Promise.all(
  assets.map(async a => {
    await mkdir(join("dist", dirname(a)), { recursive: true });
    await copyFile(join("src", a), join("dist", a));
  })
);
