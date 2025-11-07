export function parseIdQuery(id: string) {
  if (!id.includes("?")) return { filename: id, query: new URLSearchParams() };
  const [filename, rawQuery] = id.split(`?`, 2) as [string, string];
  return { filename, query: new URLSearchParams(rawQuery) };
}
