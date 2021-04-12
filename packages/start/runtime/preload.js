export default function preload(handlers, manifest, assetManifest) {
  const url = handlers
    .map((h) =>
      h.path.replace(/:(\w+)/, (f, g) => `[${g}]`).replace(/\*(\w+)/, (f, g) => `[...${g}]`)
    )
    .join("");

  if (!manifest[url]) return;
  const list = manifest[url].slice(0)
    .reverse()
    .slice(1);

  if (assetManifest) {
    const cssEntries = new Set();
    list.forEach(m => {
      const found = assetManifest[m.href];
      if (found) {
        for(const e of found) cssEntries.add(e);
      }
    });
    for(const e of cssEntries) {
      list.push({ type: "style", href: e });
    }
  }

  return (
    list
      .map((m) => m.type === "style" ? `<link rel="stylesheet" href="${m.href}" />` : `<link rel="modulepreload" href="${m.href}" />`)
      .join("")
  );
}
