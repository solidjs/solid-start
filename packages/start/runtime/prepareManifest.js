// make asset lookup
export default function prepareManifest(manifest, assetManifest) {
  const cssMap = Object.values(assetManifest).reduce((memo, entry) => {
    entry.css && (memo["/" + entry.file] = entry.css.map(c => "/" + c));
    return memo;
  }, {})

  Object.values(manifest).forEach((resources) => {
    const assets = [];
    resources.forEach((r) => {
      let src;
      if (src = cssMap[r.href]) {
        assets.push(...[...src].map(v => ({ type: "style", href: v })))
      }
    })
    if (assets.length) resources.push(...assets)
  });
}