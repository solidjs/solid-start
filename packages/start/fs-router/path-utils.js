/**
 *
 * @param {string} id
 * @param {boolean} removePathlessLayouts
 * @returns
 */
export function toPath(id, removePathlessLayouts = true) {
  const idWithoutIndex = id.endsWith("/index") ? id.slice(0, -"index".length) : id;
  return (
    removePathlessLayouts ? idWithoutIndex.replace(/\/\([^)/]+\)/g, "") : idWithoutIndex
  ).replace(/\[([^\/]+)\]/g, (_, m) => {
    if (m.length > 3 && m.startsWith("...")) {
      return `*${m.slice(3)}`;
    }
    if (m.length > 2 && m.startsWith("[") && m.endsWith("]")) {
      return `:${m.slice(1, -1)}?`;
    }
    return `:${m}`;
  });
}
