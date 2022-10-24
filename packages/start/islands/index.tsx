import { Component, ComponentProps, lazy, splitProps, useContext } from "solid-js";
import { Hydration, NoHydration } from "solid-js/web";
import { ServerContext } from "../server/ServerContext";
import { IslandManifest } from "../server/types";
export { default as clientOnly } from "./clientOnly";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "solid-island": {
        "data-props": string;
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

export function island<T extends Component<any>>(
  Comp:
    | T
    | (() => Promise<{
        default: T;
      }>),
  path?: string
): T {
  let Component = Comp as T;

  if (!import.meta.env.START_ISLANDS) {
    // TODO: have some sane semantics for islands used in non-island mode
    return lazy(Comp as () => Promise<{ default: T }>);
  }

  function IslandComponent(props) {
    return (
      <Component {...props}>
        <solid-children>
          <NoHydration>{props.children}</NoHydration>
        </solid-children>
      </Component>
    );
  }

  return ((compProps: ComponentProps<T>) => {
    if (import.meta.env.SSR) {
      const context = useContext(ServerContext);
      const [, props] = splitProps(compProps, ["children"]);

      let fpath;
      let styles = [];
      if (import.meta.env.PROD) {
        let x = context.env.manifest[path] as IslandManifest;
        context.$islands.add(path);
        fpath = x.script.href;
        styles = x.assets.filter(v => v.type == "style").map(v => v.href);
      } else {
        fpath = `/` + path;
      }

      const serialize = props => {
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

      return (
        <Hydration>
          <solid-island
            data-component={fpath}
            data-island={`/` + path}
            data-when={props["client:idle"] ? "idle" : "load"}
            data-css={JSON.stringify(styles)}
            {...serialize(props)}
          >
            <IslandComponent {...compProps} />
          </solid-island>
        </Hydration>
      );
    } else {
      return <IslandComponent />;
    }
  }) as T;
}
