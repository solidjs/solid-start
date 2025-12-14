import { onCleanup, sharedConfig } from "solid-js";
import { getRequestEvent, useAssets as useAssets_ } from "solid-js/web";
import { renderAsset, type Asset } from "./render.tsx";

const REGISTRY = Symbol("assetRegistry");
const NOOP = () => "";

type AssetEntity = {
  key: string;
  consumers: number;
  preloadEl?: HTMLLinkElement;
  ssrIdx?: number;
};
type Registry = Record<string, AssetEntity>;

const keyAttrs = ["href", "rel", "data-vite-dev-id"] as const;

const getEntity = (registry: Registry, asset: Asset) => {
  let key = asset.tag;
  for (const k of keyAttrs) {
    if (!(k in asset.attrs)) continue;
    key += `[${k}='${asset.attrs[k as keyof Asset["attrs"]]}']`;
  }

  const entity = (registry[key] ??= {
    key,
    consumers: 0,
  });

  return entity;
};

export const useAssets = (assets: Asset[], nonce?: string) => {
  if (!assets.length) return;

  const registry: Registry = (getRequestEvent()!.locals[REGISTRY] ??= {});
  const ssrRequestAssets: Function[] = (sharedConfig.context as any)?.assets;
  const cssKeys: string[] = [];

  for (const asset of assets) {
    const entity = getEntity(registry, asset);
    const isCSSLink = asset.tag === "link" && asset.attrs.rel === "stylesheet";
    const isCSS = isCSSLink || asset.tag === "style";
    if (isCSS) {
      cssKeys.push(entity.key);
    }

    entity.consumers++;
    if (entity.consumers > 1) continue;

    // Mounting logic
    useAssets_(() => renderAsset(asset, nonce));
    entity.ssrIdx = ssrRequestAssets.length - 1;
  }

  onCleanup(() => {
    for (const key of cssKeys) {
      const entity = registry[key]!;
      entity.consumers--;
      if (entity.consumers != 0) {
        continue;
      }

      // Ideally this logic should be implemented directly in dom-expressions
      ssrRequestAssets.splice(entity.ssrIdx!, 1, NOOP);

      delete registry[key];
    }
  });
};
