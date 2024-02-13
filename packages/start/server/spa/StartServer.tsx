// @ts-ignore
import type { Component } from "solid-js";
import { NoHydration, getRequestEvent, ssr } from "solid-js/web";
import type { DocumentComponentProps } from ".";
import { renderAsset } from "../renderAsset";

const docType = ssr("<!DOCTYPE html>");

export function StartServer(props: {
  document: Component<DocumentComponentProps>;
}) {
  const context = getRequestEvent();
  return (
    <NoHydration>
      {docType as unknown as any}
      <props.document
        assets={
          <>
            {context.assets.map(m => renderAsset(m))}
          </>
        }
        scripts={
          <>
            <script innerHTML={`window.manifest = ${JSON.stringify(context.manifest)}`} />
            <script
              type="module"
              src={
                import.meta.env.MANIFEST["client"].inputs[
                  import.meta.env.MANIFEST["client"].handler
                ].output.path
              }
            />
          </>
        }
      ></props.document>
    </NoHydration>
  );
}
