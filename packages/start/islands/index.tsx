import { Component, ComponentProps, createUniqueId, lazy, sharedConfig } from "solid-js";
import { HydrationContext } from "solid-js/types/render/hydration";
import { Hydration, NoHydration } from "solid-js/web";
import { useRequest } from "../server/ServerContext";
import { IslandManifest } from "../server/types";
export { default as clientOnly } from "./clientOnly";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "solid-island": {
        "data-id": string;
        "data-component": string;
        "data-island": string;
        "data-when": "idle" | "load";
        children: JSX.Element;
      };
      "solid-children": {
        children: JSX.Element;
      };
    }
  }
}


interface HydrationContextWithSerialize extends HydrationContext {
  serialize(id: string, value: unknown): void;
};

export function island<T extends Component<any>>(
  Comp:
    | T
    | (() => Promise<{
        default: T;
      }>),
  path: string
): T {
  let Component = Comp as T;

  if (!import.meta.env.START_ISLANDS) {
    // TODO: have some sane semantics for islands used in non-island mode
    return lazy(Comp as () => Promise<{ default: T }>);
  }

  function IslandComponent(props: ComponentProps<T>) {
    return (
      <Component {...props}>
        <NoHydration>{props.children}</NoHydration>
      </Component>
    );
  }

  return ((props: ComponentProps<T>) => {
    if (import.meta.env.SSR) {
      const context = useRequest();

      let fpath: string;
      let styles: string[] = [];
      if (import.meta.env.PROD) {
        let x = context.env.manifest?.[path] as IslandManifest;
        context.$islands.add(path);
        if (x) {
          fpath = x.script.href;
          styles = x.assets.filter(v => v.type == "style").map(v => v.href);
        }
      } else {
        fpath = path;
      }

      // @ts-expect-error
      if (!sharedConfig.context?.noHydrate) {
        return <Component {...props} />;
      }

      // TODO islands ID
      // Ideally we'd want to create a similar mechanism
      // to createUniqueId except that we treat
      // islands as their own tree rather than
      // createUniqueId's ownership tree.
      const id = createUniqueId();
      (sharedConfig.context as HydrationContextWithSerialize).serialize(
        id,
        props,
      );

      return (
        <Hydration>
          <solid-island
            data-id={id}
            data-component={fpath!}
            data-island={path}
            data-when={(props as any)["client:idle"] ? "idle" : "load"}
            data-css={JSON.stringify(styles)}
          >
            <IslandComponent {...props} />
          </solid-island>
        </Hydration>
      );
    }
    return <Component {...props} />;
  }) as T;
}
