import { createRenderEffect, createResource, onCleanup, sharedConfig } from "solid-js";
import { getRequestEvent, isServer, useAssets } from "solid-js/web";
import { renderAsset, type Asset } from "../server/renderAsset.jsx";

const CANCEL_EVENT = "cancel";
const EVENT_REGISTRY = Symbol("assetRegistry");
const NOOP = () => "";

type AssetEntity = { key: string; consumers: number; el?: HTMLElement; ssrIdx?: number };
type Registry = Record<string, AssetEntity>;
type AttrKeys = keyof Asset["attrs"];

const globalRegistry: Registry = {};

const getEntity = (registry: Registry, asset: Asset) => {
  let key = asset.tag;
  for (const k of Object.keys(asset.attrs)) {
    if (k === "key") continue;
    key += `[${k}='${asset.attrs[k as keyof Asset["attrs"]]}']`;
  }

  const entity = (registry[key] ??= {
    key,
    consumers: 0,
    el: isServer ? undefined : (document.querySelector("head " + key) as HTMLElement)
  });

  return entity;
};

export const mountAssets = (
  assets: Asset[],
  { unmount = true, nonce }: { unmount?: boolean; nonce?: string } = {}
) => {
  if (!assets.length) return;

  const registry: Registry = isServer
    ? (getRequestEvent()!.locals[EVENT_REGISTRY] ??= {})
    : globalRegistry;
  const ssrRequestAssets: Function[] = (sharedConfig.context as any)?.assets;
  const cssKeys: string[] = [];

  for (const asset of assets) {
    const entity = getEntity(registry, asset);
    const isCSS = asset.tag === "link" && asset.attrs.rel === "stylesheet";
    if (isCSS && entity.el?.dataset.keep != "") {
      cssKeys.push(entity.key);
    }

    entity.consumers++;
    if (entity.consumers > 1 || entity.el) continue;

    // Mounting logic
    if (isServer) {
      if (!unmount && isCSS) {
        asset.attrs["data-keep" as AttrKeys] = "";
      }
      useAssets(() => renderAsset(asset, nonce));
      entity.ssrIdx = ssrRequestAssets.length - 1;
    } else {
      const el = (entity.el = document.createElement(asset.tag));

      if (isCSS) {
        const [r] = createResource(() => {
          return new Promise(res => {
            el.addEventListener("load", res, { once: true });
            el.addEventListener(CANCEL_EVENT, res, { once: true });
            el.addEventListener("error", res, { once: true });
          });
        });
        createRenderEffect(r);
      }

      for (const k of Object.keys(asset.attrs)) {
        if (k === "key") continue;
        el.setAttribute(k, asset.attrs[k as AttrKeys]);
      }
      document.head.appendChild(el);
    }
  }

  // Unmounting logic
  if (!unmount) return;
  onCleanup(() => {
    for (const key of cssKeys) {
      const entity = registry[key]!;
      entity.consumers--;
      if (entity.consumers != 0) {
        continue;
      }

      if (isServer) {
        // Ideally this logic should be implemented directly in dom-expressions
        ssrRequestAssets.splice(entity.ssrIdx!, 1, NOOP);
      } else {
        entity.el!.dispatchEvent(new CustomEvent(CANCEL_EVENT));
        entity.el!.remove();
        delete registry[key];
      }
    }
  });
};
