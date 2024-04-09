// @refresh skip
import { lazy, sharedConfig, type Component, type ComponentProps } from "solid-js";
import { Hydration, NoHydration, getRequestEvent } from "solid-js/web";
// import { IslandManifest } from "./types";
import { splitProps } from "./utils";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "solid-island": {
        "data-props": string;
        "data-id": string;
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

  return ((compProps: ComponentProps<T>) => {
    if (import.meta.env.SSR) {
      const context = getRequestEvent();
      const [, props] = splitProps(compProps, ["children"] as any);
      const [, spreadProps] = splitProps(compProps, [] as any);

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

      const serialize = (props: ComponentProps<T>) => {
        let offset = 0;
        let el = JSON.stringify(props, (key, value) => {
          if (value && value.t) {
            offset++;
            return undefined;
          }
          return value;
        });

        return {
          "data-props": el,
          "data-offset": offset
        };
      };

      // @ts-expect-error
      if (!sharedConfig.context?.noHydrate) {
        return <Component {...compProps} />;
      }

      return (
        <Hydration>
          <solid-island
            data-id={fpath!}
            data-when={(props as any)["client:idle"] ? "idle" : "load"}
            data-css={JSON.stringify(styles)}
            {...serialize(props)}
          >
            <IslandComponent {...spreadProps} />
          </solid-island>
        </Hydration>
      );
    } else {
      return <Component {...compProps} />;
    }
  }) as T;
}
