import { defineConfig } from "vite";
import solid from "solid-start";
import { DOMElements, SVGElements } from "solid-js/web/dist/dev.cjs";

export default defineConfig({
  plugins: [
    solid({
      ssr: false,
      solid: {
        moduleName: "solid-js/web",
        generate: "dynamic",
        renderers: [
          {
            name: "dom",
            moduleName: "solid-js/web",
            elements: [...DOMElements.values(), ...SVGElements.values()]
          },
          {
            name: "universal",
            moduleName: "solid-three",
            elements: []
          }
        ]
      }
    })
  ]
});
