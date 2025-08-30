import { type Component, createComponent, type JSX, lazy, onCleanup } from "solid-js";

import { type Asset, renderAsset } from "./renderAsset.jsx";

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

      const assets = await manifest.getAssets(component.src);
      const styles = assets.filter((asset: any) => asset.tag === "style");

      if (import.meta.env.SSR && import.meta.hot)
        import.meta.hot.on("css-update", data => {
          updateStyles(styles, data);
        });

      const Comp: Component<T> = props => {
        if (typeof window !== "undefined") {
          appendStyles(styles);
        }

        onCleanup(() => {
          if (typeof window !== "undefined") {
            // remove style tags added by vite when a CSS file is imported
            cleanupStyles(styles);
          }
        });

        return [
          ...assets.map((asset: Asset) => renderAsset(asset)),
          createComponent(Component, props)
        ];
      };
      return { default: Comp };
    } else {
      const assets = await clientManifest.getAssets(component.src);
      const styles = assets.filter(
        asset =>
          asset.tag === "style" ||
          (asset.attrs as JSX.LinkHTMLAttributes<HTMLLinkElement>).rel === "stylesheet"
      );
      if (typeof window !== "undefined") {
        preloadStyles(styles);
      }
      const Comp: Component<T> = props => {
        return [
          ...styles.map((asset: Asset) => renderAsset(asset)),
          createComponent(Component, props)
        ];
      };
      return { default: Comp };
    }
  });
}

function appendStyles(styles: Array<any>) {
  styles.forEach(style => {
    let element = document.head.querySelector(
      `style[data-vite-dev-id="${style.attrs["data-vite-dev-id"]}"]`
    );
    if (!element) {
      element = document.createElement("style");
      element.setAttribute("data-vite-dev-id", style.attrs["data-vite-dev-id"]);
      element.innerHTML = style.children;
      element.setAttribute("data-vite-ref", "0");
      document.head.appendChild(element);
    }

    element.setAttribute("data-vite-ref", `${Number(element.getAttribute("data-vite-ref")) + 1}`);
  });
}

function updateStyles(styles: Array<any>, data: any) {
  const styleAsset = styles.find(s => s.attrs["data-vite-dev-id"] === data.file);
  if (styleAsset) {
    styleAsset.children = data.contents;
  }
}

function cleanupStyles(styles: Array<any>) {
  styles.forEach(style => {
    const element = document.head.querySelector(
      `style[data-vite-dev-id="${style.attrs["data-vite-dev-id"]}"]`
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

if (!import.meta.env.SSR && import.meta.hot) {
  import.meta.hot.on("css-update", data => {
    for (const el of document.querySelectorAll(`style[data-vite-dev-id="${data.file}"]`)) {
      el.innerHTML = data.contents;
    }
  });
}

export function preloadStyles(styles: Array<any>) {
  styles.forEach(style => {
    if (!style.attrs.href) {
      return;
    }

    let element = document.head.querySelector(`link[href="${style.attrs.href}"]`);
    if (!element) {
      // create a link preload element for the css file so it starts loading but doesnt get attached
      element = document.createElement("link");
      element.setAttribute("rel", "preload");
      element.setAttribute("as", "style");
      element.setAttribute("href", style.attrs.href);
      document.head.appendChild(element);
    }
  });
}
