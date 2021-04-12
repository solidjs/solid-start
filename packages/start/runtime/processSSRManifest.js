// make asset lookup
export default function processSSRManifest(ssrManifest) {
  const cssKeys = Object.keys(ssrManifest).filter(k => k.endsWith(".css"));
  return cssKeys.reduce((memo, k) => {
    const cssEntry = ssrManifest[k].find(k => k.endsWith(".css"));
    ssrManifest[k].forEach(js => {
      if (!js.endsWith(".css")) {
        const s = memo[js] || (memo[js] = new Set())
        s.add(cssEntry);
      }
    });
    return memo;
  }, {})
}