import { type Component, createComponent, type JSX, lazy, onCleanup } from "solid-js";

import { type Asset, renderAsset } from "./renderAsset.tsx";
import { useAssets } from "solid-js/web";

export default function lazyRoute<T extends Record<string, any>>(
  component: { src: string; import(): Promise<Record<string, Component>> },
  clientManifest: StartManifest,
  serverManifest: StartManifest
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
      const manifest = import.meta.env.SSR ? serverManifest : clientManifest;

      const assets = (await manifest.getAssets(component.src)).filter(
        (asset: any) => asset.tag === "link"
      );

      // if (import.meta.env.SSR && import.meta.hot)
      //   import.meta.hot.on("css-update", data => {
      //     updateStyles(styles, data);
      //   });

      const Comp: Component<T> = props => {
        if (typeof window !== "undefined") {
          appendStyles(assets);
        }

        onCleanup(() => {
          if (typeof window !== "undefined") {
            // remove style tags added by vite when a CSS file is imported
            cleanupStyles(assets);
          }
        });

        useAssets(() => assets.map((asset: Asset) => renderAsset(asset)));

        return [createComponent(Component, props)];
      };
      return { default: Comp };
    } else {
      const assets = (await clientManifest.getAssets(component.src)).filter(
        asset =>
          asset.tag === "style" ||
          (asset.attrs as JSX.LinkHTMLAttributes<HTMLLinkElement>).rel === "stylesheet"
      );
      if (typeof window !== "undefined") {
        preloadStyles(assets);
      }

      const Comp: Component<T> = props => {
        return [
          createComponent(Component, props),
          ...assets.map((asset: Asset) => renderAsset(asset))
        ];
      };
      return { default: Comp };
    }
  });
}

function appendStyles(links: Array<any>) {
  links.forEach(link => {
    let element = document.head.querySelector(
      `link[data-vite-dev-id="${link.attrs["data-vite-dev-id"]}"]`
    );
    if (!element) {
      element = document.createElement("link");
      element.setAttribute("data-vite-dev-id", link.attrs["data-vite-dev-id"]);
      element.setAttribute("data-vite-ref", "0");
      element.setAttribute("href", link.attrs["href"]);
      element.setAttribute("rel", link.attrs["rel"]);
      document.head.appendChild(element);
    }

    element.setAttribute("data-vite-ref", `${Number(element.getAttribute("data-vite-ref")) + 1}`);
  });
}

// function updateStyles(links: Array<any>, data: any) {
//   const linkAsset = links.find(s => s.attrs["data-vite-dev-id"] === data.file);
//   // if (linkAsset) {
//   //   linkAsset.children = data.contents;
//   // }
// }

function cleanupStyles(links: Array<any>) {
  links.forEach(link => {
    const element = document.head.querySelector(
      `link[data-vite-dev-id="${link.attrs["data-vite-dev-id"]}"]`
    );

    if (!element) {
      return;
    }

    if (Number(element.getAttribute("data-vite-ref")) === 1) {
      element.remove();
    } else {
      element.setAttribute("data-vite-ref", `${Number(element.getAttribute("data-vite-ref")) - 1}`);
    }
  });
}

// if (!import.meta.env.SSR && import.meta.hot) {
// import.meta.hot.on("css-update", data => {
//   for (const el of document.querySelectorAll(`link[data-vite-dev-id="${data.file}"]`)) {
//     el.innerHTML = data.contents;
//   }
// });
// }

export function preloadStyles(links: Array<any>) {
  links.forEach(link => {
    if (!link.attrs.href) {
      return;
    }
    let element = document.head.querySelector(`link[href="${link.attrs.href}"]`);
    if (!element) {
      // create a link preload element for the css file so it starts loading but doesnt get attached
      element = document.createElement("link");
      element.setAttribute("rel", "preload");
      element.setAttribute("as", "style");
      element.setAttribute("href", link.attrs.href);
      document.head.appendChild(element);
    }
  });
}
