import { solidBase } from "@kobalte/solidbase/config";
import { solidStart } from "@solidjs/start/config";
import { nitroV2Plugin } from "@solidjs/start/nitro-v2-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solidBase({
      title: "SolidBase",
      titleTemplate: ":title - SolidBase",
      description: "Fully featured, fully customisable static site generation for SolidStart",
      themeConfig: {
        sidebar: {
          "/": {
            items: [
              {
                title: "Overview",
                collapsed: false,
                items: [
                  {
                    title: "Home",
                    link: "/"
                  },
                  {
                    title: "About",
                    link: "/about"
                  }
                ]
              }
            ]
          }
        }
      }
    }),
    solidStart({ extensions: ["md", "mdx"] }),
    nitroV2Plugin({
      prerender: {
        crawlLinks: true
      }
    })
  ]
});
