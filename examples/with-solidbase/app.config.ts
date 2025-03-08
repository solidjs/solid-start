import {defineConfig} from "@solidjs/start/config";
import {withSolidBase} from "@kobalte/solidbase/config";

export default defineConfig(withSolidBase(
    // SolidStart config
    {
        server: {
            prerender: {
                crawlLinks: true,
            },
        },
    },
    // SolidBase config
    {
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
                                    link: "/",
                                },
                                {
                                    title: "About",
                                    link: "/about",
                                },
                            ],
                        },
                    ],
                },
            },
        },
    },
));
