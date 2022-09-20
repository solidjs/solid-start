export function toPath(id, removePathlessLayouts = true) {
  const idWithoutIndex = id.endsWith("/index") ? id.slice(0, -"index".length) : id;
  return (
    removePathlessLayouts ? idWithoutIndex.replace(/\/\([^)/]+\)/g, "") : idWithoutIndex
  ).replace(/\[([^\[]+)\]/g, (_, m) => (m.startsWith("...") ? `*${m.slice(3)}` : `:${m}`));
}
