// @refresh skip
// TODO rename to renderAsset.ts?
import type { JSX } from "solid-js";
import type { Asset } from "./types";

const assetMap = {
  style: (props: { attrs: JSX.StyleHTMLAttributes<HTMLStyleElement>; children?: JSX.Element }) => (
    <style {...props.attrs}>{props.children}</style>
  ),
  link: (props: { attrs: JSX.LinkHTMLAttributes<HTMLLinkElement> }) => <link {...props.attrs} />,
  script: (props: { attrs: JSX.ScriptHTMLAttributes<HTMLScriptElement>; key: string | undefined }) => {
    return props.attrs.src ? (
      <script {...props.attrs} id={props.key}>
        {" "}
      </script>
    ) : null;
  }
};

export function renderAsset(asset: Asset) {
  let { tag, attrs: { key, ...attrs } = { key: undefined }, children } = asset as any;
  return (assetMap as any)[tag]({ attrs, key, children });
}
