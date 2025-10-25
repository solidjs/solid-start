export function mergeAssets(
  ...args: ImportAssetsResultRaw[]
): ImportAssetsResult {
  const js = uniqBy(
    args.flatMap((h) => h.js),
    (a) => a.href,
  );
  const css = uniqBy(
    args.flatMap((h) => h.css),
    (a) => a.href,
  );
  const entry = args.filter((arg) => arg.entry)?.[0]?.entry;
  const raw: ImportAssetsResultRaw = { entry, js, css };
  return { ...raw, merge: (...args) => mergeAssets(raw, ...args) };
}

// merging is cumbersome because of `data-vite-dev-id` :(
function uniqBy<T>(array: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return array.filter((item) => {
    const k = key(item);
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  });
}
