import { createRenderEffect, createResource, onCleanup, sharedConfig } from "solid-js";
import { isServer, useAssets } from "solid-js/web";
import { renderAsset, type Asset } from "../server/renderAsset.jsx";

const instances: Record<string, { uses: number; el: HTMLElement }> = {};
export const mountAssets = (assets: Asset[]) => {
  if (!assets.length) return;

  if (isServer) {
    useAssets(() => assets.map((asset: Asset) => renderAsset(asset)));
    const a: [] = (sharedConfig.context as any).assets;
    const index = a.length - 1;
    onCleanup(() => {
      // TODO: index is not properly tracked!
      a.splice(index, assets.length);
    });
    return;
  }

  const keys: string[] = [];
  for (const asset of assets) {
    const attrs = Object.entries(asset.attrs);
    let key = asset.tag;
    for (const [k, v] of attrs) {
      if (k === "key") continue;
      key += `[${k}='${v}']`;
    }
    keys.push(key);

    console.log("mount", key);

    const ssrEl = document.querySelector("head " + key) as HTMLElement;
    const instance = (instances[key] ??= {
      uses: 0,
      el: ssrEl ?? document.createElement(asset.tag)
    });
    instance.uses++;

    if (instance.uses > 1 || ssrEl) continue;

    const [r] = createResource(() => {
      return new Promise(res => {
        instance.el.addEventListener("load", res, { once: true });
        instance.el.addEventListener("error", res, { once: true });
      });
    });
    createRenderEffect(r);

    for (const [k, v] of attrs) {
      if (k === "key") continue;
      instance.el.setAttribute(k, v);
    }
    document.head.append(instance.el);
  }

  onCleanup(() => {
    for (const key of keys) {
      const instance = instances[key]!;
      instance.uses--;
      if (instance.uses === 0) {
        console.log("unmount", key);
        instance.el.remove();
        delete instances[key];
      }
    }
  });
};
