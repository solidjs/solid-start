var manifest = {
	"/[...404]": [
	{
		type: "script",
		href: "/assets/_...404_.a54582fe.js"
	},
	{
		type: "script",
		href: "/assets/entry-client.fb7e7173.js"
	}
],
	"/": [
	{
		type: "script",
		href: "/assets/index.50eb8b87.js"
	},
	{
		type: "script",
		href: "/assets/entry-client.fb7e7173.js"
	},
	{
		type: "script",
		href: "/assets/createRouteAction.dda74f30.js"
	}
],
	"/login": [
	{
		type: "script",
		href: "/assets/login.081698a4.js"
	},
	{
		type: "script",
		href: "/assets/entry-client.fb7e7173.js"
	},
	{
		type: "script",
		href: "/assets/createRouteAction.dda74f30.js"
	}
],
	"*": [
	{
		type: "script",
		href: "/assets/entry-client.fb7e7173.js"
	}
]
};

var assetManifest = {
	"src/entry-client.tsx": {
	file: "assets/entry-client.fb7e7173.js",
	src: "src/entry-client.tsx",
	isEntry: true,
	dynamicImports: [
		"src/routes/[...404].tsx",
		"src/routes/index.tsx",
		"src/routes/login.tsx"
	],
	css: [
		"assets/entry-client.38531b6d.css"
	]
},
	"src/routes/[...404].tsx": {
	file: "assets/_...404_.a54582fe.js",
	src: "src/routes/[...404].tsx",
	isDynamicEntry: true,
	imports: [
		"src/entry-client.tsx"
	]
},
	"src/routes/index.tsx": {
	file: "assets/index.50eb8b87.js",
	src: "src/routes/index.tsx",
	isDynamicEntry: true,
	imports: [
		"src/entry-client.tsx",
		"_createRouteAction.dda74f30.js"
	]
},
	"_createRouteAction.dda74f30.js": {
	file: "assets/createRouteAction.dda74f30.js",
	imports: [
		"src/entry-client.tsx"
	]
},
	"src/routes/login.tsx": {
	file: "assets/login.081698a4.js",
	src: "src/routes/login.tsx",
	isDynamicEntry: true,
	imports: [
		"src/entry-client.tsx",
		"_createRouteAction.dda74f30.js"
	]
}
};

// make asset lookup
function prepareManifest(manifest, assetManifest) {
  const cssMap = Object.values(assetManifest).reduce((memo, entry) => {
    entry.css && (memo["/" + entry.file] = entry.css.map(c => "/" + c));
    return memo;
  }, {});

  Object.values(manifest).forEach((resources) => {
    const assets = [];
    resources.forEach((r) => {
      let src;
      if (src = cssMap[r.href]) {
        assets.push(...[...src].map(v => ({ type: "style", href: v })));
      }
    });
    if (assets.length) resources.push(...assets);
  });
}

const ERROR = Symbol("error");
const UNOWNED = {
  context: null,
  owner: null
};
let Owner = null;
function createRoot(fn, detachedOwner) {
  detachedOwner && (Owner = detachedOwner);
  const owner = Owner,
        root = fn.length === 0 ? UNOWNED : {
    context: null,
    owner
  };
  Owner = root;
  let result;
  try {
    result = fn(() => {});
  } catch (err) {
    const fns = lookup(Owner, ERROR);
    if (!fns) throw err;
    fns.forEach(f => f(err));
  } finally {
    Owner = owner;
  }
  return result;
}
function createSignal(value, options) {
  return [() => value, v => {
    return value = typeof v === "function" ? v(value) : v;
  }];
}
function createComputed(fn, value) {
  Owner = {
    owner: Owner,
    context: null
  };
  try {
    fn(value);
  } catch (err) {
    const fns = lookup(Owner, ERROR);
    if (!fns) throw err;
    fns.forEach(f => f(err));
  } finally {
    Owner = Owner.owner;
  }
}
const createRenderEffect = createComputed;
function createMemo(fn, value) {
  Owner = {
    owner: Owner,
    context: null
  };
  let v;
  try {
    v = fn(value);
  } catch (err) {
    const fns = lookup(Owner, ERROR);
    if (!fns) throw err;
    fns.forEach(f => f(err));
  } finally {
    Owner = Owner.owner;
  }
  return () => v;
}
function batch(fn) {
  return fn();
}
const untrack = batch;
function on(deps, fn, options = {}) {
  const isArray = Array.isArray(deps);
  const defer = options.defer;
  return () => {
    if (defer) return undefined;
    let value;
    if (isArray) {
      value = [];
      for (let i = 0; i < deps.length; i++) value.push(deps[i]());
    } else value = deps();
    return fn(value);
  };
}
function onError(fn) {
  if (Owner === null) console.warn("error handlers created outside a `createRoot` or `render` will never be run");else if (Owner.context === null) Owner.context = {
    [ERROR]: [fn]
  };else if (!Owner.context[ERROR]) Owner.context[ERROR] = [fn];else Owner.context[ERROR].push(fn);
}
function createContext(defaultValue) {
  const id = Symbol("context");
  return {
    id,
    Provider: createProvider(id),
    defaultValue
  };
}
function useContext(context) {
  let ctx;
  return (ctx = lookup(Owner, context.id)) !== undefined ? ctx : context.defaultValue;
}
function getOwner() {
  return Owner;
}
function children(fn) {
  return createMemo(() => resolveChildren(fn()));
}
function runWithOwner(o, fn) {
  const prev = Owner;
  Owner = o;
  try {
    return fn();
  } finally {
    Owner = prev;
  }
}
function lookup(owner, key) {
  return owner ? owner.context && owner.context[key] !== undefined ? owner.context[key] : lookup(owner.owner, key) : undefined;
}
function resolveChildren(children) {
  if (typeof children === "function" && !children.length) return resolveChildren(children());
  if (Array.isArray(children)) {
    const results = [];
    for (let i = 0; i < children.length; i++) {
      const result = resolveChildren(children[i]);
      Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
    }
    return results;
  }
  return children;
}
function createProvider(id) {
  return function provider(props) {
    return createMemo(() => {
      Owner.context = {
        [id]: props.value
      };
      return children(() => props.children);
    });
  };
}

function resolveSSRNode$1(node) {
  const t = typeof node;
  if (t === "string") return node;
  if (node == null || t === "boolean") return "";
  if (Array.isArray(node)) {
    let mapped = "";
    for (let i = 0, len = node.length; i < len; i++) mapped += resolveSSRNode$1(node[i]);
    return mapped;
  }
  if (t === "object") return resolveSSRNode$1(node.t);
  if (t === "function") return resolveSSRNode$1(node());
  return String(node);
}
const sharedConfig = {};
function setHydrateContext(context) {
  sharedConfig.context = context;
}
function nextHydrateContext() {
  return sharedConfig.context ? { ...sharedConfig.context,
    id: `${sharedConfig.context.id}${sharedConfig.context.count++}-`,
    count: 0
  } : undefined;
}
function createComponent(Comp, props) {
  if (sharedConfig.context && !sharedConfig.context.noHydrate) {
    const c = sharedConfig.context;
    setHydrateContext(nextHydrateContext());
    const r = Comp(props || {});
    setHydrateContext(c);
    return r;
  }
  return Comp(props || {});
}
function mergeProps(...sources) {
  const target = {};
  for (let i = 0; i < sources.length; i++) {
    const descriptors = Object.getOwnPropertyDescriptors(sources[i]);
    Object.defineProperties(target, descriptors);
  }
  return target;
}
function splitProps(props, ...keys) {
  const descriptors = Object.getOwnPropertyDescriptors(props),
        split = k => {
    const clone = {};
    for (let i = 0; i < k.length; i++) {
      const key = k[i];
      if (descriptors[key]) {
        Object.defineProperty(clone, key, descriptors[key]);
        delete descriptors[key];
      }
    }
    return clone;
  };
  return keys.map(split).concat(split(Object.keys(descriptors)));
}
function Show(props) {
  let c;
  return props.when ? typeof (c = props.children) === "function" ? c(props.when) : c : props.fallback || "";
}
function ErrorBoundary$1(props) {
  let error, res;
  const ctx = sharedConfig.context;
  const id = ctx.id + ctx.count;
  onError(err => error = err);
  createMemo(() => res = props.children);
  if (error) {
    ctx.writeResource(id, error, true);
    setHydrateContext({ ...ctx,
      count: 0
    });
    const f = props.fallback;
    return typeof f === "function" && f.length ? f(error, () => {}) : f;
  }
  return res;
}
const SuspenseContext = createContext();
let resourceContext = null;
function createResource(source, fetcher, options = {}) {
  if (arguments.length === 2) {
    if (typeof fetcher === "object") {
      options = fetcher;
      fetcher = source;
      source = true;
    }
  } else if (arguments.length === 1) {
    fetcher = source;
    source = true;
  }
  const contexts = new Set();
  const id = sharedConfig.context.id + sharedConfig.context.count++;
  let resource = {};
  let value = options.initialValue;
  let p;
  let error;
  if (sharedConfig.context.async) {
    resource = sharedConfig.context.resources[id] || (sharedConfig.context.resources[id] = {});
    if (resource.ref) {
      if (!resource.data && !resource.ref[0].loading && !resource.ref[0].error) resource.ref[1].refetch();
      return resource.ref;
    }
  }
  const read = () => {
    if (error) throw error;
    if (resourceContext && p) resourceContext.push(p);
    const resolved = sharedConfig.context.async && sharedConfig.context.resources[id].data;
    if (!resolved && read.loading) {
      const ctx = useContext(SuspenseContext);
      if (ctx) {
        ctx.resources.set(id, read);
        contexts.add(ctx);
      }
    }
    return resolved ? sharedConfig.context.resources[id].data : value;
  };
  read.loading = false;
  read.error = undefined;
  Object.defineProperty(read, "latest", {
    get() {
      return read();
    }
  });
  function load() {
    const ctx = sharedConfig.context;
    if (!ctx.async) return read.loading = !!(typeof source === "function" ? source() : source);
    if (ctx.resources && id in ctx.resources && ctx.resources[id].data) {
      value = ctx.resources[id].data;
      return;
    }
    resourceContext = [];
    const lookup = typeof source === "function" ? source() : source;
    if (resourceContext.length) {
      p = Promise.all(resourceContext).then(() => fetcher(source(), {
        value
      }));
    }
    resourceContext = null;
    if (!p) {
      if (lookup == null || lookup === false) return;
      p = fetcher(lookup, {
        value
      });
    }
    if (p != undefined && typeof p === "object" && "then" in p) {
      read.loading = true;
      if (ctx.writeResource) ctx.writeResource(id, p, undefined, options.deferStream);
      return p.then(res => {
        read.loading = false;
        ctx.resources[id].data = res;
        p = null;
        notifySuspense(contexts);
        return res;
      }).catch(err => {
        read.loading = false;
        read.error = error = err;
        p = null;
        notifySuspense(contexts);
      });
    }
    ctx.resources[id].data = p;
    if (ctx.writeResource) ctx.writeResource(id, p);
    p = null;
    return ctx.resources[id].data;
  }
  load();
  return resource.ref = [read, {
    refetch: load,
    mutate: v => value = v
  }];
}
function lazy(fn) {
  let resolved;
  const p = fn();
  const contexts = new Set();
  p.then(mod => resolved = mod.default);
  const wrap = props => {
    const id = sharedConfig.context.id.slice(0, -1);
    if (resolved) return resolved(props);
    const ctx = useContext(SuspenseContext);
    const track = {
      loading: true,
      error: undefined
    };
    if (ctx) {
      ctx.resources.set(id, track);
      contexts.add(ctx);
    }
    if (sharedConfig.context.async) p.then(() => {
      track.loading = false;
      notifySuspense(contexts);
    });
    return "";
  };
  wrap.preload = () => p;
  return wrap;
}
function suspenseComplete(c) {
  for (const r of c.resources.values()) {
    if (r.loading) return false;
  }
  return true;
}
function notifySuspense(contexts) {
  for (const c of contexts) {
    if (suspenseComplete(c)) c.completed();
  }
  contexts.clear();
}
function startTransition(fn) {
  fn();
}
function useTransition() {
  return [() => false, fn => {
    fn();
  }];
}
function Suspense(props) {
  let done;
  const ctx = sharedConfig.context;
  const id = ctx.id + ctx.count;
  const o = Owner;
  const value = ctx.suspense[id] || (ctx.suspense[id] = {
    resources: new Map(),
    completed: () => {
      const res = runSuspense();
      if (suspenseComplete(value)) {
        done(resolveSSRNode$1(res));
      }
    }
  });
  function runSuspense() {
    setHydrateContext({ ...ctx,
      count: 0
    });
    return runWithOwner(o, () => {
      return createComponent(SuspenseContext.Provider, {
        value,
        get children() {
          return props.children;
        }
      });
    });
  }
  const res = runSuspense();
  if (suspenseComplete(value)) {
    ctx.writeResource(id, null);
    return res;
  }
  onError(err => {
    if (!done || !done(undefined, err)) throw err;
  });
  done = ctx.async ? ctx.registerFragment(id) : undefined;
  if (ctx.streaming) {
    setHydrateContext(undefined);
    const res = {
      t: `<span id="pl-${id}">${resolveSSRNode$1(props.fallback)}</span>`
    };
    setHydrateContext(ctx);
    return res;
  } else if (ctx.async) {
    return {
      t: `<![${id}]>`
    };
  }
  setHydrateContext({ ...ctx,
    count: 0,
    id: ctx.id + "0.f"
  });
  return props.fallback;
}

const booleans = ["allowfullscreen", "async", "autofocus", "autoplay", "checked", "controls", "default", "disabled", "formnovalidate", "hidden", "indeterminate", "ismap", "loop", "multiple", "muted", "nomodule", "novalidate", "open", "playsinline", "readonly", "required", "reversed", "seamless", "selected"];
const BooleanAttributes = new Set(booleans);
new Set(["className", "value", "readOnly", "formNoValidate", "isMap", "noModule", "playsInline", ...booleans]);
const Aliases = {
  className: "class",
  htmlFor: "for"
};

var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped = {
  '<': '\\u003C',
  '>': '\\u003E',
  '/': '\\u002F',
  '\\': '\\\\',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\0': '\\0',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029'
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join('\0');
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === 'function') {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case 'Number':
        case 'String':
        case 'Boolean':
        case 'Date':
        case 'RegExp':
          return;
        case 'Array':
          thing.forEach(walk);
          break;
        case 'Set':
        case 'Map':
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join('\0') !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function (key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function (entry) {
    return entry[1] > 1;
  }).sort(function (a, b) {
    return b[1] - a[1];
  }).forEach(function (entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case 'Number':
      case 'String':
      case 'Boolean':
        return "Object(" + stringify(thing.valueOf()) + ")";
      case 'RegExp':
        return "new RegExp(" + stringifyString(thing.source) + ", \"" + thing.flags + "\")";
      case 'Date':
        return "new Date(" + thing.getTime() + ")";
      case 'Array':
        var members = thing.map(function (v, i) {
          return i in thing ? stringify(v) : '';
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? '' : ',';
        return "[" + members.join(',') + tail + "]";
      case 'Set':
      case 'Map':
        return "new " + type + "([" + Array.from(thing).map(stringify).join(',') + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function (key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(',') + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function (name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case 'Number':
        case 'String':
        case 'Boolean':
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case 'RegExp':
          values_1.push(thing.toString());
          break;
        case 'Date':
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case 'Array':
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function (v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case 'Set':
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function (v) {
            return "add(" + stringify(v) + ")";
          }).join('.'));
          break;
        case 'Map':
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function (_a) {
            var k = _a[0],
                v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join('.'));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? 'Object.create(null)' : '{}');
          Object.keys(thing).forEach(function (key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(',') + "){" + statements_1.join(';') + "}(" + values_1.join(',') + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = '';
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === 'string') return stringifyString(thing);
  if (thing === void 0) return 'void 0';
  if (thing === 0 && 1 / thing < 0) return '-0';
  var str = String(thing);
  if (typeof thing === 'number') return str.replace(/^(-)?0\./, '$1.');
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 0xd800 && code <= 0xdfff) {
      var next = str.charCodeAt(i + 1);
      if (code <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
const FRAGMENT_REPLACE = /<!\[([\d-]+)\]>/;
function renderToStringAsync(code, options = {}) {
  let scripts = "";
  const {
    nonce,
    renderId,
    timeoutMs = 30000
  } = options;
  const dedupe = new WeakMap();
  const context = sharedConfig.context = {
    id: renderId || "",
    count: 0,
    resources: {},
    suspense: {},
    assets: [],
    async: true,
    nonce,
    writeResource(id, p, error) {
      if (error) return scripts += `_$HY.set("${id}", ${serializeError(p)});`;
      if (!p || typeof p !== "object" || !("then" in p)) return scripts += serializeSet(dedupe, id, p) + ";";
      p.then(d => scripts += serializeSet(dedupe, id, d) + ";").catch(() => scripts += `_$HY.set("${id}", {});`);
    }
  };
  const timeout = new Promise((_, reject) => setTimeout(() => reject("renderToString timed out"), timeoutMs));
  function asyncWrap(fn) {
    return new Promise(resolve => {
      const registry = new Set();
      const cache = Object.create(null);
      sharedConfig.context.registerFragment = register;
      const rendered = fn();
      if (!registry.size) resolve(rendered);
      function register(key) {
        registry.add(key);
        return (value = "", error) => {
          if (!registry.has(key)) return;
          cache[key] = value;
          registry.delete(key);
          if (error) scripts += `_$HY.set("${key}", Promise.resolve(${serializeError(error)}));`;else scripts += `_$HY.set("${key}", null);`;
          if (!registry.size) Promise.resolve().then(() => {
            let source = resolveSSRNode(rendered);
            let final = "";
            let match;
            while (match = source.match(FRAGMENT_REPLACE)) {
              final += source.substring(0, match.index);
              source = cache[match[1]] + source.substring(match.index + match[0].length);
            }
            resolve(final + source);
          });
          return true;
        };
      }
    });
  }
  return Promise.race([asyncWrap(() => escape(code())), timeout]).then(res => {
    let html = injectAssets(context.assets, resolveSSRNode(res));
    if (scripts.length) html = injectScripts(html, scripts, nonce);
    return html;
  });
}
function Assets(props) {
  sharedConfig.context.assets.push(() => NoHydration({
    get children() {
      return resolveSSRNode(props.children);
    }
  }));
  return ssr(`%%$${sharedConfig.context.assets.length - 1}%%`);
}
function HydrationScript(props) {
  const {
    nonce
  } = sharedConfig.context;
  sharedConfig.context.assets.push(() => generateHydrationScript({
    nonce,
    ...props
  }));
  return ssr(`%%$${sharedConfig.context.assets.length - 1}%%`);
}
function NoHydration(props) {
  const c = sharedConfig.context;
  c.noHydrate = true;
  const children = props.children;
  c.noHydrate = false;
  return children;
}
function ssr(t, ...nodes) {
  if (nodes.length) {
    let result = "";
    for (let i = 0; i < t.length; i++) {
      result += t[i];
      const node = nodes[i];
      if (node !== undefined) result += resolveSSRNode(node);
    }
    t = result;
  }
  return {
    t
  };
}
function ssrClassList(value) {
  if (!value) return "";
  let classKeys = Object.keys(value),
      result = "";
  for (let i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i],
          classValue = !!value[key];
    if (!key || !classValue) continue;
    i && (result += " ");
    result += key;
  }
  return result;
}
function ssrStyle(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  let result = "";
  const k = Object.keys(value);
  for (let i = 0; i < k.length; i++) {
    const s = k[i];
    if (i) result += ";";
    result += `${s}:${escape(value[s], true)}`;
  }
  return result;
}
function ssrSpread(props, isSVG, skipChildren) {
  let result = "";
  if (props == null) return results;
  if (typeof props === "function") props = props();
  const keys = Object.keys(props);
  let classResolved;
  for (let i = 0; i < keys.length; i++) {
    const prop = keys[i];
    if (prop === "children") {
      !skipChildren && console.warn(`SSR currently does not support spread children.`);
      continue;
    }
    const value = props[prop];
    if (prop === "style") {
      result += `style="${ssrStyle(value)}"`;
    } else if (prop === "class" || prop === "className" || prop === "classList") {
      if (classResolved) continue;
      let n;
      result += `class="${(n = props.class) ? n + " " : ""}${(n = props.className) ? n + " " : ""}${ssrClassList(props.classList)}"`;
      classResolved = true;
    } else if (BooleanAttributes.has(prop)) {
      if (value) result += prop;else continue;
    } else if (value == undefined || prop === "ref" || prop.slice(0, 2) === "on") {
      continue;
    } else {
      result += `${Aliases[prop] || prop}="${escape(value, true)}"`;
    }
    if (i !== keys.length - 1) result += " ";
  }
  return result;
}
function ssrAttribute(key, value, isBoolean) {
  return isBoolean ? value ? " " + key : "" : value != null ? ` ${key}="${value}"` : "";
}
function ssrHydrationKey() {
  const hk = getHydrationKey();
  return hk ? ` data-hk="${hk}"` : "";
}
function escape(s, attr) {
  const t = typeof s;
  if (t !== "string") {
    if (!attr && t === "function") return escape(s(), attr);
    if (attr && t === "boolean") return String(s);
    return s;
  }
  const delim = attr ? '"' : "<";
  const escDelim = attr ? "&quot;" : "&lt;";
  let iDelim = s.indexOf(delim);
  let iAmp = s.indexOf("&");
  if (iDelim < 0 && iAmp < 0) return s;
  let left = 0,
      out = "";
  while (iDelim >= 0 && iAmp >= 0) {
    if (iDelim < iAmp) {
      if (left < iDelim) out += s.substring(left, iDelim);
      out += escDelim;
      left = iDelim + 1;
      iDelim = s.indexOf(delim, left);
    } else {
      if (left < iAmp) out += s.substring(left, iAmp);
      out += "&amp;";
      left = iAmp + 1;
      iAmp = s.indexOf("&", left);
    }
  }
  if (iDelim >= 0) {
    do {
      if (left < iDelim) out += s.substring(left, iDelim);
      out += escDelim;
      left = iDelim + 1;
      iDelim = s.indexOf(delim, left);
    } while (iDelim >= 0);
  } else while (iAmp >= 0) {
    if (left < iAmp) out += s.substring(left, iAmp);
    out += "&amp;";
    left = iAmp + 1;
    iAmp = s.indexOf("&", left);
  }
  return left < s.length ? out + s.substring(left) : out;
}
function resolveSSRNode(node) {
  const t = typeof node;
  if (t === "string") return node;
  if (node == null || t === "boolean") return "";
  if (Array.isArray(node)) {
    let mapped = "";
    for (let i = 0, len = node.length; i < len; i++) mapped += resolveSSRNode(node[i]);
    return mapped;
  }
  if (t === "object") return resolveSSRNode(node.t);
  if (t === "function") return resolveSSRNode(node());
  return String(node);
}
function getHydrationKey() {
  const hydrate = sharedConfig.context;
  return hydrate && !hydrate.noHydrate && `${hydrate.id}${hydrate.count++}`;
}
function generateHydrationScript({
  eventNames = ["click", "input"],
  nonce
} = {}) {
  return `<script${nonce ? ` nonce="${nonce}"` : ""}>var e,t;e=window._$HY||(_$HY={events:[],completed:new WeakSet,r:{}}),t=e=>e&&e.hasAttribute&&(e.hasAttribute("data-hk")?e:t(e.host&&e.host instanceof Node?e.host:e.parentNode)),["${eventNames.join('","')}"].forEach((o=>document.addEventListener(o,(o=>{let s=o.composedPath&&o.composedPath()[0]||o.target,a=t(s);a&&!e.completed.has(a)&&e.events.push([a,o])})))),e.init=(t,o)=>{e.r[t]=[new Promise(((e,t)=>o=e)),o]},e.set=(t,o,s)=>{(s=e.r[t])&&s[1](o),e.r[t]=[o]},e.unset=t=>{delete e.r[t]},e.load=(t,o)=>{if(o=e.r[t])return o[0]};</script><!--xs-->`;
}
function injectAssets(assets, html) {
  for (let i = 0; i < assets.length; i++) {
    html = html.replace(`%%$${i}%%`, assets[i]());
  }
  return html;
}
function injectScripts(html, scripts, nonce) {
  const tag = `<script${nonce ? ` nonce="${nonce}"` : ""}>${scripts}</script>`;
  const index = html.indexOf("<!--xs-->");
  if (index > -1) {
    return html.slice(0, index) + tag + html.slice(index);
  }
  return html + tag;
}
function serializeError(error) {
  if (error.message) {
    const fields = {};
    const keys = Object.getOwnPropertyNames(error);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = error[key];
      if (!value || key !== "message" && typeof value !== "function") {
        fields[key] = value;
      }
    }
    return `Object.assign(new Error(${devalue(error.message)}), ${devalue(fields)})`;
  }
  return devalue(error);
}
function serializeSet(registry, key, value) {
  const exist = registry.get(value);
  if (exist) return `_$HY.set("${key}", _$HY.r["${exist}"][0])`;
  value !== null && typeof value === "object" && registry.set(value, key);
  return `_$HY.set("${key}", ${devalue(value)})`;
}

const isServer = true;

/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module exports.
 * @public
 */

var parse_1 = parse;
var serialize_1 = serialize;

/**
 * Module variables.
 * @private
 */

var decode = decodeURIComponent;
var encode = encodeURIComponent;

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @public
 */

function parse(str, options) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string');
  }

  var obj = {};
  var opt = options || {};
  var pairs = str.split(';');
  var dec = opt.decode || decode;

  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var index = pair.indexOf('=');

    // skip things that don't look like key=value
    if (index < 0) {
      continue;
    }

    var key = pair.substring(0, index).trim();

    // only assign once
    if (undefined == obj[key]) {
      var val = pair.substring(index + 1, pair.length).trim();

      // quoted values
      if (val[0] === '"') {
        val = val.slice(1, -1);
      }

      obj[key] = tryDecode(val, dec);
    }
  }

  return obj;
}

/**
 * Serialize data into a cookie header.
 *
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 *
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @return {string}
 * @public
 */

function serialize(name, val, options) {
  var opt = options || {};
  var enc = opt.encode || encode;

  if (typeof enc !== 'function') {
    throw new TypeError('option encode is invalid');
  }

  if (!fieldContentRegExp.test(name)) {
    throw new TypeError('argument name is invalid');
  }

  var value = enc(val);

  if (value && !fieldContentRegExp.test(value)) {
    throw new TypeError('argument val is invalid');
  }

  var str = name + '=' + value;

  if (null != opt.maxAge) {
    var maxAge = opt.maxAge - 0;

    if (isNaN(maxAge) || !isFinite(maxAge)) {
      throw new TypeError('option maxAge is invalid')
    }

    str += '; Max-Age=' + Math.floor(maxAge);
  }

  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError('option domain is invalid');
    }

    str += '; Domain=' + opt.domain;
  }

  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError('option path is invalid');
    }

    str += '; Path=' + opt.path;
  }

  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== 'function') {
      throw new TypeError('option expires is invalid');
    }

    str += '; Expires=' + opt.expires.toUTCString();
  }

  if (opt.httpOnly) {
    str += '; HttpOnly';
  }

  if (opt.secure) {
    str += '; Secure';
  }

  if (opt.sameSite) {
    var sameSite = typeof opt.sameSite === 'string'
      ? opt.sameSite.toLowerCase() : opt.sameSite;

    switch (sameSite) {
      case true:
        str += '; SameSite=Strict';
        break;
      case 'lax':
        str += '; SameSite=Lax';
        break;
      case 'strict':
        str += '; SameSite=Strict';
        break;
      case 'none':
        str += '; SameSite=None';
        break;
      default:
        throw new TypeError('option sameSite is invalid');
    }
  }

  return str;
}

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */

function tryDecode(str, decode) {
  try {
    return decode(str);
  } catch (e) {
    return str;
  }
}

function renderAsync(fn, options) {
  return () => async (context) => {
    let markup = await renderToStringAsync(() => fn(context), options);
    if (context.routerContext.url) {
      return Response.redirect(new URL(context.routerContext.url, context.request.url), 302);
    }
    context.responseHeaders.set("Content-Type", "text/html");
    return new Response(markup, {
      status: 200,
      headers: context.responseHeaders
    });
  };
}

const MetaContext = createContext();
const cascadingTags = ["title", "meta"];

const MetaProvider = props => {
  const indices = new Map(),
        [tags, setTags] = createSignal({});
  const actions = {
    addClientTag: (tag, name) => {
      // consider only cascading tags
      if (cascadingTags.indexOf(tag) !== -1) {
        setTags(tags => {
          const names = tags[tag] || [];
          return { ...tags,
            [tag]: [...names, name]
          };
        }); // track indices synchronously

        const index = indices.has(tag) ? indices.get(tag) + 1 : 0;
        indices.set(tag, index);
        return index;
      }

      return -1;
    },
    shouldRenderTag: (tag, index) => {
      if (cascadingTags.indexOf(tag) !== -1) {
        const names = tags()[tag]; // check if the tag is the last one of similar

        return names && names.lastIndexOf(names[index]) === index;
      }

      return true;
    },
    removeClientTag: (tag, index) => {
      setTags(tags => {
        const names = tags[tag];

        if (names) {
          names[index] = null;
          return { ...tags,
            [tag]: names
          };
        }

        return tags;
      });
    }
  };

  {
    actions.addServerTag = tagDesc => {
      const {
        tags = []
      } = props; // tweak only cascading tags

      if (cascadingTags.indexOf(tagDesc.tag) !== -1) {
        const index = tags.findIndex(prev => {
          const prevName = prev.props.name || prev.props.property;
          const nextName = tagDesc.props.name || tagDesc.props.property;
          return prev.tag === tagDesc.tag && prevName === nextName;
        });

        if (index !== -1) {
          tags.splice(index, 1);
        }
      }

      tags.push(tagDesc);
    };

    if (Array.isArray(props.tags) === false) {
      throw Error("tags array should be passed to <MetaProvider /> in node");
    }
  }

  return createComponent(MetaContext.Provider, {
    value: actions,

    get children() {
      return props.children;
    }

  });
};
function renderTags(tags) {
  return tags.map(tag => {
    const keys = Object.keys(tag.props);
    const props = keys.map(k => k === "children" ? "" : ` ${k}="${tag.props[k]}"`).join("");
    return tag.props.children ? `<${tag.tag} data-sm=""${props}>${// Tags might contain multiple text children:
    //   <Title>example - {myCompany}</Title>
    Array.isArray(tag.props.children) ? tag.props.children.join("") : tag.props.children}</${tag.tag}>` : `<${tag.tag} data-sm=""${props}/>`;
  }).join("");
}
function normalizeIntegration(integration) {
    if (!integration) {
        return {
            signal: createSignal({ value: "" })
        };
    }
    else if (Array.isArray(integration)) {
        return {
            signal: integration
        };
    }
    return integration;
}
function staticIntegration(obj) {
    return {
        signal: [() => obj, next => Object.assign(obj, next)]
    };
}

const hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
const trimPathRegex = /^\/+|\/+$|\s+/g;
function normalize(path) {
    const s = path.replace(trimPathRegex, "");
    return s ? (s.startsWith("?") ? s : "/" + s) : "";
}
function resolvePath(base, path, from) {
    if (hasSchemeRegex.test(path)) {
        return undefined;
    }
    const basePath = normalize(base);
    const fromPath = from && normalize(from);
    let result = "";
    if (!fromPath || path.charAt(0) === "/") {
        result = basePath;
    }
    else if (fromPath.toLowerCase().indexOf(basePath.toLowerCase()) !== 0) {
        result = basePath + fromPath;
    }
    else {
        result = fromPath;
    }
    return result + normalize(path) || "/";
}
function invariant(value, message) {
    if (value == null) {
        throw new Error(message);
    }
    return value;
}
function joinPaths(from, to) {
    return normalize(from).replace(/\/*(\*.*)?$/g, "") + normalize(to);
}
function extractSearchParams(url) {
    const params = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}
function createMatcher(path, partial) {
    const [pattern, splat] = path.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    const len = segments.length;
    return (location) => {
        const locSegments = location.split("/").filter(Boolean);
        const lenDiff = locSegments.length - len;
        if (lenDiff < 0 || (lenDiff > 0 && splat === undefined && !partial)) {
            return null;
        }
        const match = {
            path: len ? "" : "/",
            params: {}
        };
        for (let i = 0; i < len; i++) {
            const segment = segments[i];
            const locSegment = locSegments[i];
            if (segment[0] === ":") {
                match.params[segment.slice(1)] = locSegment;
            }
            else if (segment.localeCompare(locSegment, undefined, { sensitivity: "base" }) !== 0) {
                return null;
            }
            match.path += `/${locSegment}`;
        }
        if (splat) {
            match.params[splat] = lenDiff ? locSegments.slice(-lenDiff).join("/") : "";
        }
        return match;
    };
}
function scoreRoute(route) {
    const [pattern, splat] = route.pattern.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    return segments.reduce((score, segment) => score + (segment.startsWith(":") ? 2 : 3), segments.length - (splat === undefined ? 0 : 1));
}
function createMemoObject(fn) {
    const map = new Map();
    const owner = getOwner();
    return new Proxy({}, {
        get(_, property) {
            if (!map.has(property)) {
                runWithOwner(owner, () => map.set(property, createMemo(() => fn()[property])));
            }
            return map.get(property)();
        },
        getOwnPropertyDescriptor() {
            return {
                enumerable: true,
                configurable: true
            };
        },
        ownKeys() {
            return Reflect.ownKeys(fn());
        }
    });
}
function mergeSearchString(search, params) {
    const merged = new URLSearchParams(search);
    Object.entries(params).forEach(([key, value]) => {
        if (value == null || value === "") {
            merged.delete(key);
        }
        else {
            merged.set(key, String(value));
        }
    });
    return merged.toString();
}

const MAX_REDIRECTS = 100;
const RouterContextObj = createContext();
const RouteContextObj = createContext();
const useRouter = () => invariant(useContext(RouterContextObj), "Make sure your app is wrapped in a <Router />");
let TempRoute;
const useRoute = () => TempRoute || useContext(RouteContextObj) || useRouter().base;
const useNavigate = () => useRouter().navigatorFactory();
const useLocation = () => useRouter().location;
const useParams = () => useRoute().params;
const useRouteData = () => useRoute().data;
const useSearchParams = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const setSearchParams = (params, options) => {
        const searchString = mergeSearchString(location.search, params);
        navigate(searchString ? `?${searchString}` : "", { scroll: false, ...options, resolve: true });
    };
    return [location.query, setSearchParams];
};
function createRoute(routeDef, base = "", fallback) {
    const { path: originalPath, component, data, children } = routeDef;
    const isLeaf = !children || (Array.isArray(children) && !children.length);
    const path = joinPaths(base, originalPath);
    const pattern = isLeaf ? path : path.split("/*", 1)[0];
    return {
        originalPath,
        pattern,
        element: component
            ? () => createComponent(component, {})
            : () => {
                const { element } = routeDef;
                return element === undefined && fallback
                    ? createComponent(fallback, {})
                    : element;
            },
        preload: routeDef.component
            ? component.preload
            : routeDef.preload,
        data,
        matcher: createMatcher(pattern, !isLeaf)
    };
}
function createBranch(routes, index = 0) {
    return {
        routes,
        score: scoreRoute(routes[routes.length - 1]) * 10000 - index,
        matcher(location) {
            const matches = [];
            for (let i = routes.length - 1; i >= 0; i--) {
                const route = routes[i];
                const match = route.matcher(location);
                if (!match) {
                    return null;
                }
                matches.unshift({
                    ...match,
                    route
                });
            }
            return matches;
        }
    };
}
function createBranches(routeDef, base = "", fallback, stack = [], branches = []) {
    const routeDefs = Array.isArray(routeDef) ? routeDef : [routeDef];
    for (let i = 0, len = routeDefs.length; i < len; i++) {
        const def = routeDefs[i];
        if (def && typeof def === "object" && def.hasOwnProperty("path")) {
            const route = createRoute(def, base, fallback);
            stack.push(route);
            if (def.children) {
                createBranches(def.children, route.pattern, fallback, stack, branches);
            }
            else {
                const branch = createBranch([...stack], branches.length);
                branches.push(branch);
            }
            stack.pop();
        }
    }
    // Stack will be empty on final return
    return stack.length ? branches : branches.sort((a, b) => b.score - a.score);
}
function getRouteMatches$1(branches, location) {
    for (let i = 0, len = branches.length; i < len; i++) {
        const match = branches[i].matcher(location);
        if (match) {
            return match;
        }
    }
    return [];
}
function createLocation(path, state) {
    const origin = new URL("http://sar");
    const url = createMemo(prev => {
        const path_ = path();
        try {
            return new URL(path_, origin);
        }
        catch (err) {
            console.error(`Invalid path ${path_}`);
            return prev;
        }
    }, origin);
    const pathname = createMemo(() => url().pathname);
    const search = createMemo(() => url().search.slice(1));
    const hash = createMemo(() => url().hash.slice(1));
    const key = createMemo(() => "");
    return {
        get pathname() {
            return pathname();
        },
        get search() {
            return search();
        },
        get hash() {
            return hash();
        },
        get state() {
            return state();
        },
        get key() {
            return key();
        },
        query: createMemoObject(on(search, () => extractSearchParams(url())))
    };
}
function createRouterContext(integration, base = "", data, out) {
    const { signal: [source, setSource], utils = {} } = normalizeIntegration(integration);
    const parsePath = utils.parsePath || (p => p);
    const renderPath = utils.renderPath || (p => p);
    const basePath = resolvePath("", base);
    const output = out
        ? Object.assign(out, {
            matches: [],
            url: undefined
        })
        : undefined;
    if (basePath === undefined) {
        throw new Error(`${basePath} is not a valid base path`);
    }
    else if (basePath && !source().value) {
        setSource({ value: basePath, replace: true, scroll: false });
    }
    const [isRouting, start] = useTransition();
    const [reference, setReference] = createSignal(source().value);
    const [state, setState] = createSignal(source().state);
    const location = createLocation(reference, state);
    const referrers = [];
    const baseRoute = {
        pattern: basePath,
        params: {},
        path: () => basePath,
        outlet: () => null,
        resolvePath(to) {
            return resolvePath(basePath, to);
        }
    };
    if (data) {
        try {
            TempRoute = baseRoute;
            baseRoute.data = data({
                data: undefined,
                params: {},
                location,
                navigate: navigatorFactory(baseRoute)
            });
        }
        finally {
            TempRoute = undefined;
        }
    }
    function navigateFromRoute(route, to, options) {
        // Untrack in case someone navigates in an effect - don't want to track `reference` or route paths
        untrack(() => {
            if (typeof to === "number") {
                if (!to) ;
                else if (utils.go) {
                    utils.go(to);
                }
                else {
                    console.warn("Router integration does not support relative routing");
                }
                return;
            }
            const { replace, resolve, scroll, state: nextState } = {
                replace: false,
                resolve: true,
                scroll: true,
                ...options
            };
            const resolvedTo = resolve ? route.resolvePath(to) : resolvePath("", to);
            if (resolvedTo === undefined) {
                throw new Error(`Path '${to}' is not a routable path`);
            }
            else if (referrers.length >= MAX_REDIRECTS) {
                throw new Error("Too many redirects");
            }
            const current = reference();
            if (resolvedTo !== current || nextState !== state()) {
                {
                    if (output) {
                        output.url = resolvedTo;
                    }
                    setSource({ value: resolvedTo, replace, scroll, state: nextState });
                }
            }
        });
    }
    function navigatorFactory(route) {
        // Workaround for vite issue (https://github.com/vitejs/vite/issues/3803)
        route = route || useContext(RouteContextObj) || baseRoute;
        return (to, options) => navigateFromRoute(route, to, options);
    }
    createRenderEffect(() => {
        const { value, state } = source();
        if (value !== untrack(reference)) {
            start(() => {
                setReference(value);
                setState(state);
            });
        }
    });
    return {
        base: baseRoute,
        out: output,
        location,
        isRouting,
        renderPath,
        parsePath,
        navigatorFactory
    };
}
function createRouteContext(router, parent, child, match) {
    const { base, location, navigatorFactory } = router;
    const { pattern, element: outlet, preload, data } = match().route;
    const path = createMemo(() => match().path);
    const params = createMemoObject(() => match().params);
    preload && preload();
    const route = {
        parent,
        pattern,
        get child() {
            return child();
        },
        path,
        params,
        data: parent.data,
        outlet,
        resolvePath(to) {
            return resolvePath(base.path(), to, path());
        }
    };
    if (data) {
        try {
            TempRoute = route;
            route.data = data({ data: parent.data, params, location, navigate: navigatorFactory(route) });
        }
        finally {
            TempRoute = undefined;
        }
    }
    return route;
}

const Router = props => {
  const {
    source,
    url,
    base,
    data,
    out
  } = props;
  const integration = source || (staticIntegration({
    value: url || ""
  }) );
  const routerState = createRouterContext(integration, base, data, out);
  return createComponent(RouterContextObj.Provider, {
    value: routerState,

    get children() {
      return props.children;
    }

  });
};
const Routes$1 = props => {
  const router = useRouter();
  const parentRoute = useRoute();
  const branches = createMemo(() => createBranches(props.children, joinPaths(parentRoute.pattern, props.base || ""), Outlet));
  const matches = createMemo(() => getRouteMatches$1(branches(), router.location.pathname));

  if (router.out) {
    router.out.matches.push(matches().map(({
      route,
      path,
      params
    }) => ({
      originalPath: route.originalPath,
      pattern: route.pattern,
      path,
      params
    })));
  }

  const disposers = [];
  let root;
  const routeStates = createMemo(on(matches, (nextMatches, prevMatches, prev) => {
    let equal = prevMatches && nextMatches.length === prevMatches.length;
    const next = [];

    for (let i = 0, len = nextMatches.length; i < len; i++) {
      const prevMatch = prevMatches && prevMatches[i];
      const nextMatch = nextMatches[i];

      if (prev && prevMatch && nextMatch.route.pattern === prevMatch.route.pattern) {
        next[i] = prev[i];
      } else {
        equal = false;

        if (disposers[i]) {
          disposers[i]();
        }

        createRoot(dispose => {
          disposers[i] = dispose;
          next[i] = createRouteContext(router, next[i - 1] || parentRoute, () => routeStates()[i + 1], () => matches()[i]);
        });
      }
    }

    disposers.splice(nextMatches.length).forEach(dispose => dispose());

    if (prev && equal) {
      return prev;
    }

    root = next[0];
    return next;
  }));
  return createComponent(Show, {
    get when() {
      return routeStates() && root;
    },

    children: route => createComponent(RouteContextObj.Provider, {
      value: route,

      get children() {
        return route.outlet();
      }

    })
  });
};
const useRoutes = (routes, base) => {
  return () => createComponent(Routes$1, {
    base: base,
    children: routes
  });
};
const Outlet = () => {
  const route = useRoute();
  return createComponent(Show, {
    get when() {
      return route.child;
    },

    children: child => createComponent(RouteContextObj.Provider, {
      value: child,

      get children() {
        return child.outlet();
      }

    })
  });
};

const StartContext = createContext({});
function StartProvider(props) {
  const [request, setRequest] = createSignal(new Request(props.context.request.url )); // TODO: throw error if values are used on client for anything more than stubbing
  // OR replace with actual request that updates with the current URL

  return createComponent(StartContext.Provider, {
    get value() {
      return props.context || {
        get request() {
          return request();
        },

        get responseHeaders() {
          return new Headers();
        },

        get tags() {
          return [];
        },

        get manifest() {
          return {};
        },

        get routerContext() {
          return {};
        },

        setStatusCode(code) {},

        setHeader(name, value) {}

      };
    },

    get children() {
      return props.children;
    }

  });
}

const _tmpl$$8 = ["<link", " rel=\"stylesheet\"", ">"],
      _tmpl$2$3 = ["<link", " rel=\"modulepreload\"", ">"];

function getAssetsFromManifest(manifest, routerContext) {
  const match = routerContext.matches.reduce((memo, m) => {
    memo.push(...(manifest[mapRouteToFile(m)] || []));
    return memo;
  }, []);
  const links = match.reduce((r, src) => {
    r[src.href] = src.type === "style" ? ssr(_tmpl$$8, ssrHydrationKey(), ssrAttribute("href", escape(src.href, true), false)) : ssr(_tmpl$2$3, ssrHydrationKey(), ssrAttribute("href", escape(src.href, true), false));
    return r;
  }, {});
  return Object.values(links);
}

function mapRouteToFile(matches) {
  return matches.map(h => h.originalPath.replace(/:(\w+)/, (f, g) => `[${g}]`).replace(/\*(\w+)/, (f, g) => `[...${g}]`)).join("");
}
/**
 * Links are used to load assets for the server.
 * @returns {JSXElement}
 */


function Links() {
  const context = useContext(StartContext);
  return createComponent(Assets, {
    get children() {
      return getAssetsFromManifest(context.manifest, context.routerContext);
    }

  });
}

function Meta() {
  const context = useContext(StartContext); // @ts-expect-error The ssr() types do not match the Assets child types

  return createComponent(Assets, {
    get children() {
      return ssr(renderTags(context.tags));
    }

  });
}

class FormError extends Error {
  constructor(message, {
    fieldErrors = {},
    form,
    fields,
    stack
  } = {}) {
    super(message);
    this.formError = message;
    this.name = "FormError";
    this.fields = fields || Object.fromEntries(typeof form !== "undefined" ? form.entries() : []) || {};
    this.fieldErrors = fieldErrors;

    if (stack) {
      this.stack = stack;
    }
  }

}

const XSolidStartLocationHeader = "x-solidstart-location";
const LocationHeader = "Location";
const ContentTypeHeader = "content-type";
const XSolidStartResponseTypeHeader = "x-solidstart-response-type";
const XSolidStartContentTypeHeader = "x-solidstart-content-type";
const XSolidStartOrigin = "x-solidstart-origin";
const JSONResponseType = "application/json";
function redirect(url, init = 302) {
  let responseInit = init;
  if (typeof responseInit === "number") {
    responseInit = { status: responseInit };
  } else if (typeof responseInit.status === "undefined") {
    responseInit.status = 302;
  }
  const response = new Response(null, {
    ...responseInit,
    headers: {
      ...responseInit.headers,
      [XSolidStartLocationHeader]: url,
      [LocationHeader]: url
    }
  });
  return response;
}
const redirectStatusCodes = /* @__PURE__ */ new Set([204, 301, 302, 303, 307, 308]);
function isRedirectResponse(response) {
  return response && response instanceof Response && redirectStatusCodes.has(response.status);
}
class ResponseError extends Error {
  constructor(response) {
    let message = JSON.stringify({
      $type: "response",
      status: response.status,
      message: response.statusText,
      headers: [...response.headers.entries()]
    });
    super(message);
    this.name = "ResponseError";
    this.status = response.status;
    this.headers = new Map([...response.headers.entries()]);
    this.url = response.url;
    this.ok = response.ok;
    this.statusText = response.statusText;
    this.redirected = response.redirected;
    this.bodyUsed = false;
    this.type = response.type;
    this.response = () => response;
  }
  clone() {
    return this.response();
  }
  get body() {
    return this.response().body;
  }
  async arrayBuffer() {
    return await this.response().arrayBuffer();
  }
  async blob() {
    return await this.response().blob();
  }
  async formData() {
    return await this.response().formData();
  }
  async text() {
    return await this.response().text();
  }
  async json() {
    return await this.response().json();
  }
}
function respondWith(request, data, responseType) {
  if (data instanceof ResponseError) {
    data = data.clone();
  }
  if (data instanceof Response) {
    if (isRedirectResponse(data) && request.headers.get(XSolidStartOrigin) === "client") {
      let headers = new Headers(data.headers);
      headers.set(XSolidStartOrigin, "server");
      headers.set(XSolidStartLocationHeader, data.headers.get(LocationHeader));
      headers.set(XSolidStartResponseTypeHeader, responseType);
      headers.set(XSolidStartContentTypeHeader, "response");
      return new Response(null, {
        status: 204,
        headers
      });
    } else {
      data.headers.set(XSolidStartResponseTypeHeader, responseType);
      data.headers.set(XSolidStartContentTypeHeader, "response");
      return data;
    }
  } else if (data instanceof FormError) {
    return new Response(JSON.stringify({
      error: {
        message: data.message,
        stack: data.stack,
        formError: data.formError,
        fields: data.fields,
        fieldErrors: data.fieldErrors
      }
    }), {
      status: 400,
      headers: {
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "form-error"
      }
    });
  } else if (data instanceof Error) {
    return new Response(JSON.stringify({
      error: {
        message: data.message,
        stack: data.stack,
        status: data.status
      }
    }), {
      status: data.status || 500,
      headers: {
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "error"
      }
    });
  } else if (typeof data === "object" || typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        [ContentTypeHeader]: "application/json",
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "json"
      }
    });
  }
  return new Response("null", {
    status: 200,
    headers: {
      [ContentTypeHeader]: "application/json",
      [XSolidStartContentTypeHeader]: "json",
      [XSolidStartResponseTypeHeader]: responseType
    }
  });
}
async function parseResponse(request, response) {
  const contentType = response.headers.get(XSolidStartContentTypeHeader) || response.headers.get(ContentTypeHeader) || "";
  if (contentType.includes("json")) {
    return await response.json();
  } else if (contentType.includes("text")) {
    return await response.text();
  } else if (contentType.includes("form-error")) {
    const data = await response.json();
    return new FormError(data.error.message, {
      fieldErrors: data.error.fieldErrors,
      fields: data.error.fields,
      stack: data.error.stack
    });
  } else if (contentType.includes("error")) {
    const data = await response.json();
    const error = new Error(data.error.message);
    if (data.error.stack) {
      error.stack = data.error.stack;
    }
    return error;
  } else if (contentType.includes("response")) {
    if (response.status === 204 && response.headers.get(LocationHeader)) {
      return redirect(response.headers.get(LocationHeader));
    }
    return response;
  } else {
    if (response.status === 200) {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
      }
    }
    if (response.status === 204 && response.headers.get(LocationHeader)) {
      return redirect(response.headers.get(LocationHeader));
    }
    return response;
  }
}

const resources = new Set();
function createRouteResource(source, fetcher, options) {
  if (arguments.length === 2) {
    if (typeof fetcher === "object") {
      options = fetcher;
      fetcher = source;
      source = true;
    }
  } else if (arguments.length === 1) {
    fetcher = source;
    source = true;
  }

  const navigate = useNavigate();
  const context = useContext(StartContext);

  function handleResponse(response) {
    if (isRedirectResponse(response)) {
      navigate(response.headers.get(LocationHeader), {
        replace: true
      });

      {
        context.setStatusCode(response.status);
        response.headers.forEach((head, value) => {
          context.setHeader(value, head);
        });
      }
    }
  }

  let fetcherWithRedirect = async (...args) => {
    try {
      const [key, info] = args;

      if (info.refetching && info.refetching !== true && !partialMatch(key, info.refetching)) {
        return info.value;
      }

      let response = await fetcher(context, ...args);

      if (response instanceof Response) {
        setTimeout(() => handleResponse(response), 0);
        return response;
      }

      return response;
    } catch (e) {
      if (e instanceof Response) {
        setTimeout(() => handleResponse(e), 0);
        return e;
      }

      throw e;
    }
  }; // @ts-ignore


  const [resource, {
    refetch
  }] = createResource(source, fetcherWithRedirect, options);
  resources.add(refetch);
  return resource;
}
function refetchRouteResources(key) {
  for (let refetch of resources) refetch(key);
}
/* React Query key matching  https://github.com/tannerlinsley/react-query */

function partialMatch(a, b) {
  const ensuredA = ensureQueryKeyArray(a);

  if (Array.isArray(b)) {
    return b.some(b => partialDeepEqual(ensuredA, ensureQueryKeyArray(b)));
  }

  return partialDeepEqual(ensuredA, ensureQueryKeyArray(b));
}

function ensureQueryKeyArray(value) {
  return Array.isArray(value) ? value : [value];
}
/**
 * Checks if `b` partially matches with `a`.
 */


function partialDeepEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (a && b && typeof a === "object" && typeof b === "object") {
    return !Object.keys(b).some(key => !partialDeepEqual(a[key], b[key]));
  }

  return false;
}

const _tmpl$$7 = ["<form", " ", ">", "</form>"];
let FormImpl = _props => {
  let [props, rest] = splitProps(mergeProps({
    reloadDocument: false,
    replace: false,
    method: "post",
    action: "/",
    encType: "application/x-www-form-urlencoded"
  }, _props), ["reloadDocument", "replace", "method", "action", "encType", "fetchKey", "onSubmit", "children", "ref"]);
  useSubmitImpl(props.fetchKey, submission => {
    props.onSubmit(submission);
  });
  let formMethod = props.method.toLowerCase() === "get" ? "get" : "post"; // let formAction = useFormAction(props.action, formMethod);
  return ssr(_tmpl$$7, ssrHydrationKey() + ssrAttribute("method", escape(formMethod, true), false) + ssrAttribute("action", escape(_props.action, true), false), ssrSpread(rest, false, true), escape(props.children));
};
function useSubmitImpl(key, onSubmit) {
  // let defaultAction = useFormAction();
  // let { transitionManager } = useRemixEntryContext();
  return (target, options = {}) => {
    let method;
    let action;
    let encType;
    let formData;

    if (isFormElement(target)) {
      let submissionTrigger = options.submissionTrigger;
      method = options.method || target.method;
      action = options.action || target.action;
      encType = options.encType || target.enctype;
      formData = new FormData(target);

      if (submissionTrigger && submissionTrigger.name) {
        formData.append(submissionTrigger.name, submissionTrigger.value);
      }
    } else if (isButtonElement(target) || isInputElement(target) && (target.type === "submit" || target.type === "image")) {
      let form = target.form;

      if (form == null) {
        throw new Error(`Cannot submit a <button> without a <form>`);
      } // <button>/<input type="submit"> may override attributes of <form>


      method = options.method || target.getAttribute("formmethod") || form.method;
      action = options.action || target.getAttribute("formaction") || form.action;
      encType = options.encType || target.getAttribute("formenctype") || form.enctype;
      formData = new FormData(form); // Include name + value from a <button>

      if (target.name) {
        formData.set(target.name, target.value);
      }
    } else {
      if (isHtmlElement(target)) {
        throw new Error(`Cannot submit element that is not <form>, <button>, or ` + `<input type="submit|image">`);
      }

      method = options.method || "get";
      action = options.action || "/";
      encType = options.encType || "application/x-www-form-urlencoded";

      if (target instanceof FormData) {
        formData = target;
      } else {
        formData = new FormData();

        if (target instanceof URLSearchParams) {
          for (let [name, value] of target) {
            formData.append(name, value);
          }
        } else if (target != null) {
          for (let name of Object.keys(target)) {
            formData.append(name, target[name]);
          }
        }
      }
    }

    let {
      protocol,
      host
    } = window.location;
    let url = new URL(isButtonElement(action) ? "/" : action, `${protocol}//${host}`);

    if (method.toLowerCase() === "get") {
      for (let [name, value] of formData) {
        if (typeof value === "string") {
          url.searchParams.append(name, value);
        } else {
          throw new Error(`Cannot submit binary form data using GET`);
        }
      }
    }

    let submission = {
      formData,
      action: url.pathname + url.search,
      method: method.toUpperCase(),
      encType,
      key: typeof key !== "undefined" ? key : Math.random().toString(36).substring(2, 8)
    };
    onSubmit(submission);
  };
}

function isHtmlElement(object) {
  return object != null && typeof object.tagName === "string";
}

function isButtonElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
}

function isFormElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
}

function isInputElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
}

const _tmpl$$6 = ["<input", " type=\"hidden\" name=\"_key\"", ">"];

/**
 *
 * @param actionFn the async function that handles the submission, this would be where you call your API
 */
function createActionState(actionFn) {
  const [submissions, setSubmissions] = createSignal({});
  let index = 0;

  async function actionWithKey(submission, _k) {
    let i = ++index;

    let key = () => _k || `${i}`;

    let submissionState, setSubmissionState;

    if (submissions()[key()]) {
      submissionState = submissions()[key()].state;
      setSubmissionState = submissions()[key()].setState;
      setSubmissionState({
        status: "submitting",
        data: null,
        error: null,
        readError: false,
        variables: submission
      });
    } else {
      [submissionState, setSubmissionState] = createSignal({
        status: "submitting",
        data: null,
        error: null,
        readError: false,
        variables: submission
      });
      setSubmissions({ ...submissions(),
        [key()]: {
          get variables() {
            return submissionState().variables;
          },

          get status() {
            return submissionState().status;
          },

          get error() {
            if (!submissionState().readError) {
              setSubmissionState(e => ({ ...e,
                readError: true
              }));
            }

            return submissionState().error;
          },

          get key() {
            return key();
          },

          state: submissionState,
          setState: setSubmissionState,
          index: i
        }
      });
    }

    try {
      let response = await actionFn(...submission); // if response was successful, remove the submission since its resolved
      // TODO: figure out if this is the appropriate behaviour, should we keep successful submissions?
      // setSubmissions(obj => {
      //   let newObj = { ...obj };
      //   delete newObj[key()];
      //   return newObj;
      // });

      setSubmissionState(sub => ({ ...sub,
        status: "success",
        data: response,
        error: null
      }));
      return response;
    } catch (e) {
      // console.error(e);
      setSubmissionState(sub => ({ ...sub,
        status: "error",
        data: null,
        error: e
      }));
      throw e;
    }
  }

  return [submissions, actionWithKey];
}

function createRouteAction(fn, options = {}) {
  const [submissions, action] = createActionState(fn);
  const navigate = useNavigate();
  const actionOwner = getOwner();

  function submitWithKey(submission = [], key = "", owner = actionOwner) {
    return action(submission, key).then(response => {
      if (response instanceof Response) {
        if (response.status === 302) {
          runWithOwner(owner, () => {
            startTransition(() => {
              navigate(response.headers.get("Location") || "/");
              refetchRouteResources(options.invalidate);
            });
          });
        }
      } else {
        runWithOwner(owner, () => {
          startTransition(() => refetchRouteResources(options.invalidate));
        });
      }

      return response;
    }).catch(e => {
      const sub = submissions()[key];
      runWithOwner(owner, () => {
        if (e instanceof Response && isRedirectResponse(e)) {
          startTransition(() => {
            navigate(e.headers.get("Location") || "/");
            refetchRouteResources(options.invalidate);
          });
          return;
        }

        if (!sub.state().readError) {
          throw e;
        }
      });
    });
  }

  function submit(...submission) {
    return submitWithKey(submission);
  }

  function Form(props) {
    const owner = getOwner();
    let url = fn.url;
    return createComponent(FormImpl, mergeProps(props, {
      action: url,
      onSubmit: submission => {
        const key = typeof props.key !== "undefined" ? props.key : Math.random().toString(36).substring(2, 8);
        submitWithKey([submission.formData], key, owner);
      },

      get children() {
        return [createComponent(Show, {
          get when() {
            return props.key;
          },

          get children() {
            return ssr(_tmpl$$6, ssrHydrationKey(), ssrAttribute("value", escape(props.key, true), false));
          }

        }), () => props.children];
      }

    }));
  }

  submit.Form = Form;
  submit.url = fn.url;

  submit.isSubmitting = () => Object.values(submissions()).filter(sub => sub.status === "submitting").length > 0;

  let getSubmissions = () => {
    const existingSubmissions = submissions();
    const [params] = useSearchParams();
    let param = params.form ? JSON.parse(params.form) : null;

    if (!param) {
      return existingSubmissions;
    }

    let entry = param.entries.find(e => e[0] === "_key");
    let key = typeof entry !== "undefined" ? entry[1] : "default";

    if (param.url !== fn.url) {
      return existingSubmissions;
    }

    let error = param.error ? new FormError(param.error.message, {
      fieldErrors: param.error.fieldErrors,
      stack: param.error.stack,
      form: param.error.form,
      fields: param.error.fields
    }) : null;
    let paramForm = {
      key,
      error: error,
      index: -1,
      status: error ? "error" : "idle",
      variables: {
        action: param.url,
        method: "POST",
        // mock readonly form data to read the information from the form
        // submission from the URL params
        formData: {
          get: name => {
            let entry = param.entries.find(e => e[0] === name);
            return typeof entry !== "undefined" ? entry[1] : undefined;
          }
        }
      }
    };
    return {
      [paramForm.key]: paramForm,
      ...existingSubmissions
    };
  };

  submit.submissions = getSubmissions;

  submit.submission = key => getSubmissions()[key ?? ""];

  submit.submit = submitWithKey;
  return submit;
}

const api = [
  {
    get: "skip",
    path: "/*404"
  },
  {
    get: "skip",
    path: "/"
  },
  {
    get: "skip",
    path: "/login"
  }
];
function routeToMatchRoute(route) {
  const segments = route.path.split("/").filter(Boolean);
  const params = [];
  const matchSegments = [];
  let score = route.path.endsWith("/") ? 4 : 0;
  let wildcard = false;
  for (const [index, segment] of segments.entries()) {
    if (segment[0] === ":") {
      const name = segment.slice(1);
      score += 3;
      params.push({
        type: ":",
        name,
        index
      });
      matchSegments.push(null);
    } else if (segment[0] === "*") {
      params.push({
        type: "*",
        name: segment.slice(1),
        index
      });
      wildcard = true;
    } else {
      score += 4;
      matchSegments.push(segment);
    }
  }
  return {
    ...route,
    score,
    params,
    matchSegments,
    wildcard
  };
}
function getRouteMatches(routes, path, method) {
  const segments = path.split("/").filter(Boolean);
  routeLoop:
    for (const route of routes) {
      const matchSegments = route.matchSegments;
      if (segments.length < matchSegments.length || !route.wildcard && segments.length > matchSegments.length) {
        continue;
      }
      for (let index = 0; index < matchSegments.length; index++) {
        const match = matchSegments[index];
        if (!match) {
          continue;
        }
        if (segments[index] !== match) {
          continue routeLoop;
        }
      }
      const handler = route[method];
      if (handler === "skip" || handler === void 0) {
        return;
      }
      const params = {};
      for (const { type, name, index } of route.params) {
        if (type === ":") {
          params[name] = segments[index];
        } else {
          params[name] = segments.slice(index).join("/");
        }
      }
      return { handler, params };
    }
}
const allRoutes = api.map(routeToMatchRoute).sort((a, b) => b.score - a.score);
function getApiHandler(url, method) {
  return getRouteMatches(allRoutes, url.pathname, method.toLowerCase());
}

const server = (fn) => {
  throw new Error("Should be compiled away");
};
Object.defineProperty(server, "request", {
  get() {
    throw new Error("Should be compiled away");
  }
});
Object.defineProperty(server, "responseHeaders", {
  get() {
    throw new Error("Should be compiled away");
  }
});
if (!isServer || undefined === "client") {
  let createRequestInit = function(...args) {
    let body, headers = {
      [XSolidStartOrigin]: "client"
    };
    if (args.length === 1 && args[0] instanceof FormData) {
      body = args[0];
    } else {
      if (Array.isArray(args) && args.length > 2) {
        let secondArg = args[1];
        if (typeof secondArg === "object" && "value" in secondArg && "refetching" in secondArg) {
          secondArg.value = void 0;
        }
      }
      body = JSON.stringify(args, (key, value) => {
        if (value instanceof Headers) {
          return {
            $type: "headers",
            values: [...value.entries()]
          };
        }
        if (value instanceof Request) {
          return {
            $type: "request",
            url: value.url,
            method: value.method,
            headers: value.headers
          };
        }
        return value;
      });
      headers[ContentTypeHeader] = JSONResponseType;
    }
    return {
      method: "POST",
      body,
      headers: {
        ...headers
      }
    };
  };
  server.fetcher = fetch;
  server.setFetcher = (fetch2) => {
    server.fetcher = fetch2;
  };
  server.createFetcher = (route) => {
    let fetcher = function(...args) {
      const requestInit = createRequestInit(...args);
      return server.call(route, requestInit);
    };
    fetcher.url = route;
    fetcher.fetch = (init) => server.call(route, init);
    return fetcher;
  };
  server.call = async function(route, init) {
    const request = new Request(new URL(route, window.location.href).href, init);
    const handler = server.fetcher;
    const response = await handler(request);
    if (response.headers.get(XSolidStartResponseTypeHeader) === "throw") {
      throw await parseResponse(request, response);
    } else {
      return await parseResponse(request, response);
    }
  };
  server.fetch = async function(route, init) {
    const request = new Request(new URL(route, window.location.href).href, init);
    const handler = server.fetcher;
    const response = await handler(request);
    return response;
  };
}
async function parseRequest(request) {
  let contentType = request.headers.get(ContentTypeHeader);
  let name = new URL(request.url).pathname, args = [];
  if (contentType) {
    if (contentType === JSONResponseType) {
      let text = await request.text();
      try {
        args = JSON.parse(text, (key, value) => {
          if (!value) {
            return value;
          }
          if (value.$type === "headers") {
            let headers = new Headers();
            request.headers.forEach((value2, key2) => headers.set(key2, value2));
            value.values.forEach(([key2, value2]) => headers.set(key2, value2));
            return headers;
          }
          if (value.$type === "request") {
            return new Request(value.url, {
              method: value.method,
              headers: value.headers
            });
          }
          return value;
        });
      } catch (e) {
        throw new Error(`Error parsing request body: ${text}`);
      }
    } else if (contentType.includes("form")) {
      let formData = await request.formData();
      args = [formData];
    }
  }
  return [name, args];
}
async function handleServerRequest(ctx) {
  const url = new URL(ctx.request.url);
  if (server.hasHandler(url.pathname)) {
    try {
      let [name, args] = await parseRequest(ctx.request);
      let handler = server.getHandler(name);
      if (!handler) {
        throw {
          status: 404,
          message: "Handler Not Found for " + name
        };
      }
      const data = await handler.call(ctx, ...Array.isArray(args) ? args : [args]);
      return respondWith(ctx.request, data, "return");
    } catch (error) {
      return respondWith(ctx.request, error, "throw");
    }
  }
  return null;
}
if (isServer || undefined === "client") {
  const handlers = /* @__PURE__ */ new Map();
  server.createHandler = (_fn, hash) => {
    let fn = function(...args) {
      let ctx;
      if (typeof this === "object" && this.request instanceof Request) {
        ctx = this;
      } else if (sharedConfig.context && sharedConfig.context.requestContext) {
        ctx = sharedConfig.context.requestContext;
      } else {
        ctx = {
          request: new URL(hash, "http://localhost:3000").href,
          responseHeaders: new Headers()
        };
      }
      const execute = async () => {
        try {
          let e = await _fn.call(ctx, ...args);
          return e;
        } catch (e) {
          if (/[A-Za-z]+ is not defined/.test(e.message)) {
            const error = new Error(e.message + "\n You probably are using a variable defined in a closure in your server function.");
            error.stack = e.stack;
            throw error;
          }
          throw e;
        }
      };
      return execute();
    };
    fn.url = hash;
    fn.action = function(...args) {
      return fn.call(this, ...args);
    };
    return fn;
  };
  server.registerHandler = function(route, handler) {
    handlers.set(route, handler);
  };
  server.getHandler = function(route) {
    return handlers.get(route);
  };
  server.hasHandler = function(route) {
    return handlers.has(route);
  };
  server.fetch = async function(route, init) {
    let url = new URL(route, "http://localhost:3000");
    const request = new Request(url.href, init);
    const handler = getApiHandler(url, request.method);
    const response = await handler.handler({ request }, handler.params);
    return response;
  };
}

const createCookieFactory = ({ sign, unsign }) => (name, cookieOptions = {}) => {
  let { secrets, ...options } = {
    secrets: [],
    path: "/",
    ...cookieOptions
  };
  return {
    get name() {
      return name;
    },
    get isSigned() {
      return secrets.length > 0;
    },
    get expires() {
      return typeof options.maxAge !== "undefined" ? new Date(Date.now() + options.maxAge * 1e3) : options.expires;
    },
    async parse(cookieHeader, parseOptions) {
      if (!cookieHeader)
        return null;
      let cookies = parse_1(cookieHeader, { ...options, ...parseOptions });
      return name in cookies ? cookies[name] === "" ? "" : await decodeCookieValue(unsign, cookies[name], secrets) : null;
    },
    async serialize(value, serializeOptions) {
      return serialize_1(name, value === "" ? "" : await encodeCookieValue(sign, value, secrets), {
        ...options,
        ...serializeOptions
      });
    }
  };
};
const isCookie = (object) => {
  return object != null && typeof object.name === "string" && typeof object.isSigned === "boolean" && typeof object.parse === "function" && typeof object.serialize === "function";
};
async function encodeCookieValue(sign, value, secrets) {
  let encoded = encodeData(value);
  if (secrets.length > 0) {
    encoded = await sign(encoded, secrets[0]);
  }
  return encoded;
}
async function decodeCookieValue(unsign, value, secrets) {
  if (secrets.length > 0) {
    for (let secret of secrets) {
      let unsignedValue = await unsign(value, secret);
      if (unsignedValue !== false) {
        return decodeData(unsignedValue);
      }
    }
    return null;
  }
  return decodeData(value);
}
function encodeData(value) {
  return btoa(JSON.stringify(value));
}
function decodeData(value) {
  try {
    return JSON.parse(atob(value));
  } catch (error) {
    return {};
  }
}

const alreadyWarned = {};
function warnOnce(condition, message) {
  if (!condition && !alreadyWarned[message]) {
    alreadyWarned[message] = true;
    console.warn(message);
  }
}
function flash(name) {
  return `__flash_${name}__`;
}
const createSession = (initialData = {}, id = "") => {
  let map = new Map(Object.entries(initialData));
  return {
    get id() {
      return id;
    },
    get data() {
      return Object.fromEntries(map);
    },
    has(name) {
      return map.has(name) || map.has(flash(name));
    },
    get(name) {
      if (map.has(name))
        return map.get(name);
      let flashName = flash(name);
      if (map.has(flashName)) {
        let value = map.get(flashName);
        map.delete(flashName);
        return value;
      }
      return void 0;
    },
    set(name, value) {
      map.set(name, value);
    },
    flash(name, value) {
      map.set(flash(name), value);
    },
    unset(name) {
      map.delete(name);
    }
  };
};
function warnOnceAboutSigningSessionCookie(cookie) {
  warnOnce(cookie.isSigned, `The "${cookie.name}" cookie is not signed, but session cookies should be signed to prevent tampering on the client before they are sent back to the server. See https://remix.run/api/remix#signing-cookies for more information.`);
}

const createCookieSessionStorageFactory = (createCookie) => ({ cookie: cookieArg } = {}) => {
  let cookie = isCookie(cookieArg) ? cookieArg : createCookie(cookieArg?.name || "__session", cookieArg);
  warnOnceAboutSigningSessionCookie(cookie);
  return {
    async getSession(cookieHeader, options) {
      return createSession(cookieHeader && await cookie.parse(cookieHeader, options) || {});
    },
    async commitSession(session, options) {
      return cookie.serialize(session.data, options);
    },
    async destroySession(_session, options) {
      return cookie.serialize("", {
        ...options,
        expires: new Date(0)
      });
    }
  };
};

const encoder = new TextEncoder();
const sign = async (value, secret) => {
  let key = await createKey(secret, ["sign"]);
  let data = encoder.encode(value);
  let signature = await crypto.subtle.sign("HMAC", key, data);
  let hash = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=+$/, "");
  return value + "." + hash;
};
const unsign = async (signed, secret) => {
  let index = signed.lastIndexOf(".");
  let value = signed.slice(0, index);
  let hash = signed.slice(index + 1);
  let key = await createKey(secret, ["verify"]);
  let data = encoder.encode(value);
  let signature = byteStringToUint8Array(atob(hash));
  let valid = await crypto.subtle.verify("HMAC", key, signature, data);
  return valid ? value : false;
};
async function createKey(secret, usages) {
  let key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);
  return key;
}
function byteStringToUint8Array(byteString) {
  let array = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i);
  }
  return array;
}

const createCookie = createCookieFactory({ sign, unsign });
const createCookieSessionStorage = createCookieSessionStorageFactory(createCookie);

let users = [{ id: 0, username: "kody", password: "twixrox" }];
const db = {
  user: {
    async create({ data }) {
      let user = { ...data, id: users.length };
      users.push(user);
      return user;
    },
    async findUnique({ where: { username = void 0, id = void 0 } }) {
      if (id !== void 0) {
        return users.find((user) => user.id === id);
      } else {
        return users.find((user) => user.username === username);
      }
    }
  }
};

async function register({
  username,
  password
}) {
  return db.user.create({
    data: {
      username: username,
      password
    }
  });
}
async function login$1({
  username,
  password
}) {
  console.log(username, password);
  const user = await db.user.findUnique({
    where: {
      username
    }
  });
  if (!user) return null;
  const isCorrectPassword = password === user.password;
  if (!isCorrectPassword) return null;
  return user;
}
//   throw new Error("SESSION_SECRET must be set");
// }

const storage = createCookieSessionStorage({
  cookie: {
    name: "RJ_session",
    // secure doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: true,
    secrets: ["hello"],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true
  }
});
function getUserSession(request) {
  return storage.getSession(request.headers.get("Cookie"));
}
async function getUserId(request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}
async function getUser(request) {
  const userId = await getUserId(request);

  if (typeof userId !== "string") {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: {
        id: Number(userId)
      }
    });
    return user;
  } catch {
    throw logout(request);
  }
}
async function logout(request) {
  const session = await storage.getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session)
    }
  });
}
async function createUserSession(userId, redirectTo) {
  const session = await storage.getSession();
  session.set("userId", userId);
  console.log(session);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session)
    }
  });
}

const $$server_module0$3 = server.createHandler(async function $$serverHandler0({
  request
}) {
  const user = await getUser(request);

  if (!user) {
    throw redirect("/login");
  }

  return user;
}, "/_m/0dbe216f23/routeData");
server.registerHandler("/_m/0dbe216f23/routeData", $$server_module0$3);
function routeData$1() {
  return createRouteResource($$server_module0$3);
}
const $$server_module1$3 = server.createHandler(async function $$serverHandler1() {
  const $$ctx = this;
  return logout($$ctx.request);
}, "/_m/90d4313cf1/logoutAction");
server.registerHandler("/_m/90d4313cf1/logoutAction", $$server_module1$3);

function validateUsername$1(username) {
  if (typeof username !== "string" || username.length < 3) {
    return `Usernames must be at least 3 characters long`;
  }
}

function validatePassword$1(password) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}

const $$server_module0$2 = server.createHandler(async function $$serverHandler0({
  request
}) {

  if (await getUser(request)) {
    throw redirect("/");
  }

  return {};
}, "/_m/8846f80cea/routeData");
server.registerHandler("/_m/8846f80cea/routeData", $$server_module0$2);
function routeData() {
  return createRouteResource($$server_module0$2);
}
const $$server_module1$2 = server.createHandler(async function $$serverHandler1(form) {
  const loginType = form.get("loginType");
  const username = form.get("username");
  const password = form.get("password");
  const redirectTo = form.get("redirectTo") || "/";

  if (typeof loginType !== "string" || typeof username !== "string" || typeof password !== "string" || typeof redirectTo !== "string") {
    throw new FormError(`Form not submitted correctly.`);
  }

  const fields = {
    loginType,
    username,
    password
  };
  const fieldErrors = {
    username: validateUsername$1(username),
    password: validatePassword$1(password)
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    throw new FormError("Fields invalid", {
      fieldErrors,
      fields
    });
  }

  switch (loginType) {
    case "login":
      {
        const user = await login$1({
          username,
          password
        });

        if (!user) {
          throw new FormError(`Username/Password combination is incorrect`, {
            fields
          });
        }

        return createUserSession(`${user.id}`, redirectTo);
      }

    case "register":
      {
        const userExists = await db.user.findUnique({
          where: {
            username
          }
        });

        if (userExists) {
          throw new FormError(`User with username ${username} already exists`, {
            fields
          });
        }

        const user = await register({
          username,
          password
        });

        if (!user) {
          throw new FormError(`Something went wrong trying to create a new user.`, {
            fields
          });
        }

        return createUserSession(`${user.id}`, redirectTo);
      }

    default:
      {
        throw new FormError(`Login type invalid`, {
          fields
        });
      }
  }
}, "/_m/2e7970cbec/loginAction");
server.registerHandler("/_m/2e7970cbec/loginAction", $$server_module1$2);

/// <reference path="../server/types.tsx" />
const routes = [{
  component: lazy(() => Promise.resolve().then(function () { return ____404_; })),
  path: "/*404"
}, {
  data: routeData$1,
  component: lazy(() => Promise.resolve().then(function () { return index; })),
  path: "/"
}, {
  data: routeData,
  component: lazy(() => Promise.resolve().then(function () { return login; })),
  path: "/login"
}]; // console.log(routes);

/**
 * Routes are the file system based routes, used by Solid App Router to show the current page according to the URL.
 */

const Routes = useRoutes(routes);

const _tmpl$$5 = ["<script", " type=\"module\" async", "></script>"];

function getFromManifest(manifest) {
  const match = manifest["*"];
  const entry = match.find(src => src.type === "script");
  return ssr(_tmpl$$5, ssrHydrationKey(), ssrAttribute("src", escape(entry.href, true), false));
}

function Scripts() {
  const context = useContext(StartContext);
  return [createComponent(HydrationScript, {}), createComponent(NoHydration, {
    get children() {
      return (getFromManifest(context.manifest));
    }

  })];
}

const _tmpl$$4 = ["<div", " style=\"", "\"><div style=\"", "\"><p style=\"", "\" id=\"error-message\">", "</p><button id=\"reset-errors\" style=\"", "\">Clear errors and retry</button><pre style=\"", "\">", "</pre></div></div>"];
function ErrorBoundary(props) {
  return createComponent(ErrorBoundary$1, {
    fallback: e => {
      return createComponent(Show, {
        get when() {
          return !props.fallback;
        },

        get fallback() {
          return props.fallback(e);
        },

        get children() {
          return createComponent(ErrorMessage, {
            error: e
          });
        }

      });
    },

    get children() {
      return props.children;
    }

  });
}

function ErrorMessage(props) {
  return ssr(_tmpl$$4, ssrHydrationKey(), "padding:" + "16px", "background-color:" + "rgba(252, 165, 165)" + (";color:" + "rgb(153, 27, 27)") + (";border-radius:" + "5px") + (";overflow:" + "scroll") + (";padding:" + "16px") + (";margin-bottom:" + "8px"), "font-weight:" + "bold", escape(props.error.message), "color:" + "rgba(252, 165, 165)" + (";background-color:" + "rgb(153, 27, 27)") + (";border-radius:" + "5px") + (";padding:" + "4px 8px"), "margin-top:" + "8px" + (";width:" + "100%"), escape(props.error.stack));
}

const _tmpl$$3 = ["<head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">", "", "</head>"],
      _tmpl$2$2 = ["<html", " lang=\"en\">", "<body><!--#-->", "<!--/--><!--#-->", "<!--/--></body></html>"],
      _tmpl$3$1 = ["<div", ">Loading</div>"];
function Root() {
  return ssr(_tmpl$2$2, ssrHydrationKey(), NoHydration({
    get children() {
      return ssr(_tmpl$$3, escape(createComponent(Meta, {})), escape(createComponent(Links, {})));
    }

  }), escape(createComponent(ErrorBoundary, {
    get children() {
      return createComponent(Suspense, {
        get fallback() {
          return ssr(_tmpl$3$1, ssrHydrationKey());
        },

        get children() {
          return createComponent(Routes, {});
        }

      });
    }

  })), escape(createComponent(Scripts, {})));
}

const inlineServerFunctions = ({ forward }) => {
  return async (ctx) => {
    const url = new URL(ctx.request.url);
    if (server.hasHandler(url.pathname)) {
      let contentType = ctx.request.headers.get("content-type");
      let origin = ctx.request.headers.get("x-solidstart-origin");
      let formRequestBody;
      if (contentType != null && contentType.includes("form") && !(origin != null && origin.includes("client"))) {
        let [read1, read2] = ctx.request.body.tee();
        formRequestBody = new Request(ctx.request.url, {
          body: read2,
          headers: ctx.request.headers,
          method: ctx.request.method
        });
        ctx.request = new Request(ctx.request.url, {
          body: read1,
          headers: ctx.request.headers,
          method: ctx.request.method
        });
      }
      const serverResponse = await handleServerRequest(ctx);
      let responseContentType = serverResponse.headers.get("x-solidstart-content-type");
      if (formRequestBody && responseContentType !== null && responseContentType.includes("error")) {
        const formData = await formRequestBody.formData();
        let entries = [...formData.entries()];
        return new Response(null, {
          status: 302,
          headers: {
            Location: new URL(ctx.request.headers.get("referer")).pathname + "?form=" + encodeURIComponent(JSON.stringify({
              url: url.pathname,
              entries,
              ...await serverResponse.json()
            }))
          }
        });
      }
      return serverResponse;
    }
    const response = await forward(ctx);
    if (ctx.responseHeaders.get("x-solidstart-status-code")) {
      return new Response(response.body, {
        status: parseInt(ctx.responseHeaders.get("x-solidstart-status-code")),
        headers: response.headers
      });
    }
    return response;
  };
};

const apiRoutes = ({ forward }) => {
  return async (ctx) => {
    let apiHandler = getApiHandler(new URL(ctx.request.url), ctx.request.method);
    if (apiHandler) {
      return await apiHandler.handler(ctx, apiHandler.params);
    }
    return await forward(ctx);
  };
};

const rootData = Object.values({})[0];
const dataFn = rootData ? rootData.default : undefined;
/** Function responsible for listening for streamed [operations]{@link Operation}. */

/** This composes an array of Exchanges into a single ExchangeIO function */
const composeMiddleware = exchanges => ({
  ctx,
  forward
}) => exchanges.reduceRight((forward, exchange) => exchange({
  ctx: ctx,
  forward
}), forward);
function createHandler(...exchanges) {
  const exchange = composeMiddleware([apiRoutes, inlineServerFunctions, ...exchanges]);
  return async request => {
    return await exchange({
      ctx: {
        request
      },
      // fallbackExchange
      forward: async op => {
        return new Response(null, {
          status: 404
        });
      }
    })(request);
  };
}
const docType = ssr("<!DOCTYPE html>");
var StartServer = (({
  context
}) => {
  let pageContext = context;
  pageContext.routerContext = {};
  pageContext.tags = [];

  pageContext.setStatusCode = code => {
    pageContext.responseHeaders.set("x-solidstart-status-code", code.toString());
  };

  pageContext.setHeader = (name, value) => {
    pageContext.responseHeaders.set(name, value.toString());
  }; // @ts-expect-error


  sharedConfig.context.requestContext = context;
  const parsed = new URL(context.request.url);
  const path = parsed.pathname + parsed.search;
  return createComponent(StartProvider, {
    context: pageContext,

    get children() {
      return createComponent(MetaProvider, {
        get tags() {
          return pageContext.tags;
        },

        get children() {
          return createComponent(Router, {
            url: path,

            get out() {
              return pageContext.routerContext;
            },

            data: dataFn,

            get children() {
              return [docType, createComponent(Root, {})];
            }

          });
        }

      });
    }

  });
});

var entryServer = createHandler(renderAsync(context => createComponent(StartServer, {
  context: context
})));

const _tmpl$$2 = ["<main", " class=\"w-full p-4 space-y-2\"><h1 class=\"font-bold text-xl\">Page Not Found</h1></main>"];
function NotFound() {
  return ssr(_tmpl$$2, ssrHydrationKey());
}

var ____404_ = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': NotFound
}, Symbol.toStringTag, { value: 'Module' }));

const _tmpl$$1 = ["<button", " name=\"logout\" type=\"submit\">Logout</button>"],
      _tmpl$2$1 = ["<main", " class=\"w-full p-4 space-y-2\"><h1 class=\"font-bold text-3xl\">Hello <!--#-->", "<!--/--></h1><h3 class=\"font-bold text-xl\">Message board</h3><!--#-->", "<!--/--></main>"];
const $$server_module0$1 = server.createHandler(async function $$serverHandler0({
  request
}) {
  const user = await getUser(request);

  if (!user) {
    throw redirect("/login");
  }

  return user;
}, "/_m/0dbe216f23/routeData");
server.registerHandler("/_m/0dbe216f23/routeData", $$server_module0$1);
const $$server_module1$1 = server.createHandler(async function $$serverHandler1() {
  const $$ctx = this;
  return logout($$ctx.request);
}, "/_m/90d4313cf1/logoutAction");
server.registerHandler("/_m/90d4313cf1/logoutAction", $$server_module1$1);
function Home() {
  const user = useRouteData();
  const logoutAction = createRouteAction($$server_module1$1);
  return ssr(_tmpl$2$1, ssrHydrationKey(), escape(user()?.username), escape(createComponent(logoutAction.Form, {
    get children() {
      return ssr(_tmpl$$1, ssrHydrationKey());
    }

  })));
}

var index = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': Home
}, Symbol.toStringTag, { value: 'Module' }));

const _tmpl$ = ["<input", " type=\"hidden\" name=\"redirectTo\"", ">"],
      _tmpl$2 = ["<fieldset", " class=\"flex flex-row\"><legend class=\"sr-only\">Login or Register?</legend><label class=\"w-full\"><input type=\"radio\" name=\"loginType\" value=\"login\"", "> Login</label><label class=\"w-full\"><input type=\"radio\" name=\"loginType\" value=\"register\"> Register</label></fieldset>"],
      _tmpl$3 = ["<p", " class=\"text-red-400\" role=\"alert\">", "</p>"],
      _tmpl$4 = ["<div", "><label for=\"username-input\">Username</label><input name=\"username\" placeholder=\"kody\" class=\"border-gray-700 border-2 ml-2 rounded-md px-2\"><!--#-->", "<!--/--></div>"],
      _tmpl$5 = ["<div", "><label for=\"password-input\">Password</label><input name=\"password\" type=\"password\" placeholder=\"twixrox\" class=\"border-gray-700 border-2 ml-2 rounded-md px-2\"><!--#-->", "<!--/--></div>"],
      _tmpl$6 = ["<p", " class=\"text-red-400\" role=\"alert\" id=\"error-message\">", "</p>"],
      _tmpl$7 = ["<button", " class=\"focus:bg-white hover:bg-white bg-gray-300 rounded-md px-2\" type=\"submit\">", "</button>"],
      _tmpl$8 = ["<div", " class=\"p-4\"><div data-light=\"\"><main class=\"p-6 mx-auto w-[fit-content] space-y-4 rounded-lg bg-gray-100\"><h1 class=\"font-bold text-xl\">Login</h1><!--#-->", "<!--/--></main></div></div>"],
      _tmpl$9 = ["<div", ">Error</div>"];

function validateUsername(username) {
  if (typeof username !== "string" || username.length < 3) {
    return `Usernames must be at least 3 characters long`;
  }
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}

const $$server_module0 = server.createHandler(async function $$serverHandler0({
  request
}) {

  if (await getUser(request)) {
    throw redirect("/");
  }

  return {};
}, "/_m/8846f80cea/routeData");
server.registerHandler("/_m/8846f80cea/routeData", $$server_module0);
const $$server_module1 = server.createHandler(async function $$serverHandler1(form) {
  const loginType = form.get("loginType");
  const username = form.get("username");
  const password = form.get("password");
  const redirectTo = form.get("redirectTo") || "/";

  if (typeof loginType !== "string" || typeof username !== "string" || typeof password !== "string" || typeof redirectTo !== "string") {
    throw new FormError(`Form not submitted correctly.`);
  }

  const fields = {
    loginType,
    username,
    password
  };
  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password)
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    throw new FormError("Fields invalid", {
      fieldErrors,
      fields
    });
  }

  switch (loginType) {
    case "login":
      {
        const user = await login$1({
          username,
          password
        });

        if (!user) {
          throw new FormError(`Username/Password combination is incorrect`, {
            fields
          });
        }

        return createUserSession(`${user.id}`, redirectTo);
      }

    case "register":
      {
        const userExists = await db.user.findUnique({
          where: {
            username
          }
        });

        if (userExists) {
          throw new FormError(`User with username ${username} already exists`, {
            fields
          });
        }

        const user = await register({
          username,
          password
        });

        if (!user) {
          throw new FormError(`Something went wrong trying to create a new user.`, {
            fields
          });
        }

        return createUserSession(`${user.id}`, redirectTo);
      }

    default:
      {
        throw new FormError(`Login type invalid`, {
          fields
        });
      }
  }
}, "/_m/2e7970cbec/loginAction");
server.registerHandler("/_m/2e7970cbec/loginAction", $$server_module1);
function Login() {
  const data = useRouteData();
  /**
   * This helper function gives us typechecking for our ActionData return
   * statements, while still returning the accurate HTTP status, 400 Bad Request,
   * to the client.
   */

  const loginAction = createRouteAction($$server_module1);
  const params = useParams();
  return ssr(_tmpl$8, ssrHydrationKey(), escape(createComponent(ErrorBoundary, {
    fallback: () => ssr(_tmpl$9, ssrHydrationKey()),

    get children() {
      return createComponent(loginAction.Form, {
        key: "login",
        method: "post",
        "class": "flex flex-col space-y-2",

        get children() {
          return [ssr(_tmpl$, ssrHydrationKey(), ssrAttribute("value", escape(params.redirectTo, true) ?? "/", false)), ssr(_tmpl$2, ssrHydrationKey(), ssrAttribute("checked", true, true)), ssr(_tmpl$4, ssrHydrationKey(), escape(createComponent(Show, {
            get when() {
              return loginAction.submission("login")?.error?.fieldErrors?.username;
            },

            get children() {
              return ssr(_tmpl$3, ssrHydrationKey(), escape(loginAction.submission("login")?.error.fieldErrors.username));
            }

          }))), ssr(_tmpl$5, ssrHydrationKey(), escape(createComponent(Show, {
            get when() {
              return loginAction.submission("login")?.error?.fieldErrors?.password;
            },

            get children() {
              return ssr(_tmpl$3, ssrHydrationKey(), escape(loginAction.submission("login")?.error.fieldErrors.password));
            }

          }))), createComponent(Show, {
            get when() {
              return loginAction.submission("login")?.error;
            },

            get children() {
              return ssr(_tmpl$6, ssrHydrationKey(), escape(loginAction.submission("login")?.error.message));
            }

          }), ssr(_tmpl$7, ssrHydrationKey(), data() ? "Login" : "")];
        }

      });
    }

  })));
}

var login = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': Login
}, Symbol.toStringTag, { value: 'Module' }));

prepareManifest(manifest, assetManifest);

const onRequestGet = ({ request, next }) => {
  // Handle static assets
  if (/\.\w+$/.test(request.url)) {
    return next(request);
  }

  return entryServer({
    request,
    responseHeaders: new Headers(),
    manifest
  });
};

const onRequestHead = ({ request, next }) => {
  // Handle static assets
  if (/\.\w+$/.test(request.url)) {
    return next(request);
  }

  return entryServer({
    request,
    responseHeaders: new Headers(),
    manifest
  });
};

async function onRequestPost({ request }) {
  // Allow for POST /_m/33fbce88a9 server function
  return entryServer({
    request,
    responseHeaders: new Headers(),
    manifest
  });
}

export { onRequestGet, onRequestHead, onRequestPost };
