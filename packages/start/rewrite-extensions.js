import { createResolver } from "exsolve";
import { readFileSync, writeFileSync } from "fs";
import { generateCode, parseModule } from "magicast";
import { dirname, relative } from "path";
import { globSync } from "tinyglobby";

const { resolveModulePath } = createResolver({
  suffixes: ["/index", ""],
  extensions: [".tsx", ".jsx", ".ts", ".js"]
});

const files = globSync("dist/**/*.d.ts", { absolute: true });

files.forEach(async file => {
  const mod = parseModule(readFileSync(file, "utf8"));

  mod.imports.$ast.body.forEach(node => {
    if (node.source && (node.source.value.startsWith(".") || node.source.value.startsWith(".."))) {
      let path = relative(dirname(file), resolveModulePath(node.source.value, { from: file }));

      if (!path.startsWith(".")) path = "./" + path;

      node.source.value = path;
    }
  });

  writeFileSync(file, generateCode(mod).code);
});
