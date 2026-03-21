// @refresh skip
//
// NOTE: This file intentionally avoids JSX to work around a crash in
// babel-plugin-jsx-dom-expressions@0.41.0-next.9 when spread attributes are
// used on native HTML elements during SSR transformation.  The previous
// implementation used JSX (<style {...props.attrs}> etc.) which triggered the
// bug.  Instead we build the HTML strings directly — these assets are only
// ever rendered during SSR so reactive JSX is unnecessary.

import type { JSX } from "solid-js";

/** Escape HTML special characters for safe attribute / text insertion. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderAttrs(obj: Record<string, any>): string {
  let out = "";
  for (const [k, v] of Object.entries(obj)) {
    if (v == null || v === false || v === undefined) continue;
    if (v === true) {
      out += ` ${esc(k)}`;
    } else {
      out += ` ${esc(k)}="${esc(String(v))}"`;
    }
  }
  return out;
}

export function renderAsset(asset: Asset, nonce?: string) {
  let {
    tag,
    attrs: { key, ...rest } = { key: undefined },
    children,
  } = asset as any;

  const allAttrs = { ...rest, nonce } as Record<string, any>;

  let html: string;
  switch (tag as string) {
    case "style":
      html = `<style${renderAttrs(allAttrs)}>${children ?? ""}</style>`;
      break;
    case "link":
      html = `<link${renderAttrs(allAttrs)} />`;
      break;
    case "script":
      if (!allAttrs.src) return { t: "" };
      html = `<script${renderAttrs(allAttrs)}${key ? ` id="${esc(key)}"` : ""}> </script>`;
      break;
    case "noscript":
      html = `<noscript${renderAttrs(allAttrs)}>${children ?? ""}</noscript>`;
      break;
    default:
      html = "";
  }

  // Return as an SSR node object ({ t: string }) so that @solidjs/web's
  // escape() passes it through unmodified and resolveSSRNode() uses it directly.
  return { t: html };
}

export type Asset =
  | {
      tag: "style";
      attrs: JSX.StyleHTMLAttributes<HTMLStyleElement> & { key?: string };
      children?: JSX.Element;
    }
  | {
      tag: "script";
      attrs: JSX.ScriptHTMLAttributes<HTMLScriptElement> & { key?: string };
    }
  | {
      tag: "link";
      attrs: JSX.LinkHTMLAttributes<HTMLLinkElement> & { key?: string };
    };
