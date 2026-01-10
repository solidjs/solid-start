import { Plugin } from "vite";

const id = "virtual:virtualModule.css";
const resolvedId = "\0" + id;

const virtualCSS = () =>
  ({
    name: "css-fixture-virtual-css",
    resolveId(source) {
      if (source === id) return resolvedId;
    },
    load(id) {
      if (id.startsWith(resolvedId))
        return `.virtualCss { background-color: var(--color-success); }`;
    },
  }) satisfies Plugin;

export default virtualCSS;
