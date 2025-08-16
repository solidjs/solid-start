// @refresh skip
// TODO rename to renderAsset.ts?
import type { JSX } from "solid-js";

const assetMap = {
  style: (props: { attrs: JSX.StyleHTMLAttributes<HTMLStyleElement>; children?: JSX.Element }) => (
    <style {...props.attrs}>{props.children}</style>
  ),
  link: (props: { attrs: JSX.LinkHTMLAttributes<HTMLLinkElement> }) => <link {...props.attrs} />,
  script: (props: {
    attrs: JSX.ScriptHTMLAttributes<HTMLScriptElement>;
    key: string | undefined;
  }) => {
    return props.attrs.src ? (
      <script {...props.attrs} id={props.key}>
        {" "}
      </script>
    ) : null;
  },
  noscript: (props: { attrs: JSX.HTMLAttributes<HTMLElement>; children: JSX.Element }) => (
    <noscript {...props.attrs}>{props.children}</noscript>
  )
};

export function renderAsset(asset: Asset, nonce?: string) {
  let { tag, attrs: { key, ...attrs } = { key: undefined }, children } = asset as any;
  return (assetMap as any)[tag]({ attrs: { ...attrs, nonce }, key, children });
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
