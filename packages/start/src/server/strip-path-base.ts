/** Strip deploy base path from a URL pathname so API and page routes match file routes. */
export function stripPathBase(path: string, base: string): string {
  if (base === "/" || base === "") return path;
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (normalizedBase === "") return path;
  return path.startsWith(normalizedBase) ? path.slice(normalizedBase.length) || "/" : path;
}
