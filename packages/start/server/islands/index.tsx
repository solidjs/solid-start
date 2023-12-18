import { Component, ComponentProps, lazy, sharedConfig } from "solid-js";
import { Hydration, NoHydration, getRequestEvent } from "solid-js/web";
// import { IslandManifest } from "./types";
import { splitProps } from "./utils";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "solid-island": {
        "data-id": string;
        "data-props": string;
        "data-path": string;
        "data-when": "idle" | "load";
        children: JSX.Element;
      };
      "solid-children": {
        children: JSX.Element;
      };
    }
  }
}

export function createIslandReference<T extends Component<any>>(
  Comp:
    | T
    | (() => Promise<{
      default: T;
    }>),
  id: string,
  name: string
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
      // @ts-expect-error
      if (!sharedConfig.context?.noHydrate) {
        return <Component {...props} />;
      }
      const context = getRequestEvent();
      const [main, rest] = splitProps(props, ["children"] as any);

      let fpath: string;
      let styles: string[] = [];
      // if (import.meta.env.PROD) {
      //   let x = context.env.manifest?.[path] as IslandManifest;
      //   context.$islands.add(path);
      //   if (x) {
      //     fpath = x.script.href;
      //     styles = x.assets.filter(v => v.type == "style").map(v => v.href);
      //   }
      // } else {
      fpath = id + "#" + name;
      // }

      const target = sharedConfig.context.nextRoot();
      const prevID = sharedConfig.context.id;
      const prevCount = sharedConfig.context.count;

      sharedConfig.context.id = target;

      const result = (
        <Hydration>
          <solid-island
            data-id={target}
            data-path={fpath!}
            data-when={(props as any)["client:idle"] ? "idle" : "load"}
            data-css={JSON.stringify(styles)}
          >
            <IslandComponent {...rest}>
              {/* TODO */}
            </IslandComponent>
          </solid-island>
        </Hydration>
      );

      sharedConfig.context.id = prevID;
      sharedConfig.context.count = prevCount;

      sharedConfig.context.serialize(target, rest);

      return result;
    }
    return <Component {...props} />;
  }) as T;
}
