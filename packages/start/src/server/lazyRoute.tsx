import { createComponent, lazy, onCleanup, type Component, type JSX } from "solid-js";
import { manifest } from "solid-start:server-manifest";

import { renderAsset } from "./renderAsset.jsx";
import { Asset } from "./types.js";

export default function lazyRoute<T extends Record<string, any>>(
  component: { src: string; import(): Promise<Record<string, Component>> }
  // clientManifest: any,
  // serverManifest: any,
) {
  return lazy(async () => {
    const componentModule = await component.import().catch(() => null);
    if (!componentModule) return { default: () => [] };

    const exportName = "default";

    const Component = componentModule[exportName];
    if (!Component) {
      console.error(`Module ${component.src} does not export ${exportName}`);
      return { default: () => [] };
    }

    if (import.meta.env.DEV) {
      // let manifest = import.meta.env.SSR ? serverManifest : clientManifest;

      // let assets = await clientManifest.inputs?.[component.src]?.assets();
      // const styles = assets.filter((asset: Asset) => asset.tag === "style");

      // if (typeof window !== "undefined" && import.meta.hot) {
      //   import.meta.hot.on("css-update", data => {
      //     updateStyles(styles, data);
      //   });
      // }

      const Comp: Component<T> = props => {
        // if (typeof window !== "undefined") {
        //   appendStyles(styles);
        // }

        // onCleanup(() => {
        //   if (typeof window !== "undefined") {
        //     // remove style tags added by vite when a CSS file is imported
        //     cleanupStyles(styles);
        //   }
        // });
        return [
          // ...assets.map((asset: Asset) => renderAsset(asset)),
          createComponent(Component, props)
        ];
      };
      return { default: Comp };
    } else {
      // let assets = await clientManifest.inputs?.[component.src].assets();
      // const styles = assets.filter(
      //   (asset: Asset) =>
      //     asset.tag === "style" ||
      //     (asset.attrs as JSX.LinkHTMLAttributes<HTMLLinkElement>).rel === "stylesheet"
      // );
      // if (typeof window !== "undefined") {
      //   preloadStyles(styles);
      // }
      const Comp: Component<T> = props => {
        return [
          // ...styles.map((asset: Asset) => renderAsset(asset)),
          createComponent(Component, props)
        ];
      };
      return { default: Comp };
    }
  });
}
