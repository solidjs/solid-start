// @ts-nocheck
import { $PROXY } from "solid-js";

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
export function splitProps<T>(props: T, ...keys: (keyof T)[]): [T, T] {
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
