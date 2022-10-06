import { Component, ComponentProps, lazy, splitProps, useContext } from "solid-js";
import { ServerContext } from "../server/ServerContext";
import { IslandManifest } from "../server/types";

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
        <solid-children>{props.children}</solid-children>
      </Component>
    );
  }

  return ((compProps: ComponentProps<T>) => {
    if (import.meta.env.SSR) {
      const context = useContext(ServerContext);
      const [, props] = splitProps(compProps, ["children"]);

      let fpath;

      if (import.meta.env.PROD) {
        fpath = (context.env.manifest[path] as IslandManifest).script.href;
      } else {
        fpath = `/` + path;
      }

      return (
        <solid-island
          data-props={JSON.stringify(props)}
          data-component={fpath}
          data-island={`/` + path}
          data-when={props["client:idle"] ? "idle" : "load"}
        >
          <IslandComponent {...compProps} />
        </solid-island>
      );
    } else {
      return <IslandComponent />;
    }
  }) as T;
}
