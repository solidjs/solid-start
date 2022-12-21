import { Component, ComponentProps, lazy, splitProps } from "solid-js";
import { Hydration, NoHydration } from "solid-js/web";
export { default as clientOnly } from "./clientOnly";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "solid-island": {
        "data-props": string;
        "data-component-id": string;
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
  componentId?: string
): T {
  let Component = Comp as T;

  if (!import.meta.env.START_ISLANDS) {
    // TODO: have some sane semantics for islands used in non-island mode
    return lazy(Comp as () => Promise<{ default: T }>);
  }

  function IslandComponent(props: ComponentProps<any>) {
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
      const [, props] = splitProps(compProps, ["children"]);
      if (!componentId) {
        throw new Error("componentId should exist");
      }

      return (
        <Hydration>
          <solid-island
            data-props={JSON.stringify(props)}
            data-component-id={componentId}
            data-when={props["client:idle"] ? "idle" : "load"}
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
