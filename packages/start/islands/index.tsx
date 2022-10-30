import { $PROXY, Component, ComponentProps, lazy, sharedConfig, useContext } from "solid-js";
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

function islandProps(props) {
  const descriptors = Object.getOwnPropertyDescriptors(props);

  const target = {};
  const other = {};
  Object.keys(descriptors).forEach(k => {
    if (descriptors[k].get) {
      if (k !== "children") {
        Object.defineProperty(target, k, {
          ...descriptors[k],
          get() {
            return descriptors[k].get();
          }
        });
      }
      let a;
      Object.defineProperty(other, k, {
        ...descriptors[k],
        get() {
          if (a) {
            return a;
          }
          a = descriptors[k].get();
          return a;
        }
      });
    } else {
      if (k !== "children") {
        Object.defineProperty(target, k, {
          ...descriptors[k]
        });
      }
      Object.defineProperty(other, k, {
        ...descriptors[k]
      });
    }
  });
  return [target, other];
}
function trueFn() {
  return true;
}
const propTraps = {
  get(_, property, receiver) {
    if (property === $PROXY) return receiver;
    return _.get(property);
  },
  has(_, property) {
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn
    };
  },
  ownKeys(_) {
    return _.keys();
  }
};

function splitProps(props, ...keys) {
  const blocked = new Set(keys.flat());
  const descriptors = Object.getOwnPropertyDescriptors(props);
  const isProxy = $PROXY in props;
  if (!isProxy) keys.push(Object.keys(descriptors).filter(k => !blocked.has(k)));

  const res = keys.map(k => {
    const clone = {};
    for (let i = 0; i < k.length; i++) {
      const key = k[i];
      let cache;
      Object.defineProperty(clone, key, {
        enumerable: descriptors[key]?.enumerable ?? false,
        configurable: true,
        get() {
          if (cache) {
            return cache;
          }
          let val = props[key];
          if (val?.t) {
            val.t = `<solid-children>${val.t}</solid-children>`;
          }
          cache = val;
          return val;
        },
        set() {
          return true;
        }
      });
    }
    return clone;
  });
  if (isProxy) {
    res.push(
      new Proxy(
        {
          get(property) {
            return blocked.has(property) ? undefined : props[property];
          },
          has(property) {
            return blocked.has(property) ? false : property in props;
          },
          keys() {
            return Object.keys(props).filter(k => !blocked.has(k));
          }
        },
        propTraps
      )
    );
  }
  return res;
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
        <NoHydration>{props.children}</NoHydration>
      </Component>
    );
  }

  return ((compProps: ComponentProps<T>) => {
    if (import.meta.env.SSR) {
      const context = useContext(ServerContext);
      const [, props] = splitProps(compProps, ["children"]);
      const [, spreadProps] = splitProps(compProps, []);

      let fpath;
      let styles = [];
      if (import.meta.env.PROD) {
        let x = context.env.manifest[path] as IslandManifest;
        context.$islands.add(path);
        if (x) {
          fpath = x.script.href;
          styles = x.assets.filter(v => v.type == "style").map(v => v.href);
        }
      } else {
        fpath = path;
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

      // let cache = {};
      // const proxy = new Proxy(compProps, {
      //   get: (target, prop) => {
      //     console.log(prop);
      //     const v = target[prop];
      //     if (v && v.t) {
      //       console.log(prop, v);
      //       if (!cache[prop]) {
      //         cache[prop] = v;
      //       }
      //       return cache[prop];
      //     }
      //     return v;
      //   }
      // });

      // console.log(compProps, proxy);

      if (!sharedConfig.context.noHydrate) {
        return <Component {...compProps} />;
      }

      return (
        <Hydration>
          <solid-island
            data-component={fpath}
            data-island={path}
            data-when={props["client:idle"] ? "idle" : "load"}
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
