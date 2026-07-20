export function stripPathBase(path: string, base: string) {
  if (!base || base === "/") return path;

  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (path === normalizedBase) return "/";
  if (path.startsWith(`${normalizedBase}/`)) return path.slice(normalizedBase.length);

  return path;
}
