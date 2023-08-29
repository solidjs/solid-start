import { MetaProvider } from "@solidjs/meta";
import { Router, RouterProps } from "@solidjs/router";
// @ts-ignore
import Root from "~start/root";
import { ServerContext } from "../server/ServerContext";
import { FETCH_EVENT, PageEvent } from "../server/types";

const rootData: { default: <T>() => Promise<T> } = Object.values(
  import.meta.glob("/src/root.data.(js|ts)", { eager: true })
)[0] as any;
const dataFn = rootData ? rootData.default : undefined;

function throwClientError(field: string): any {
  throw new Error(
    `"${field}" is not available on the client. Use it within an \`if (isServer)\` block to ensure it only runs on the server`
  );
}

export default ({
  routerProps
}: {
  /**
   * Override props passed to `<Router`.
   * 
   * Only `source` is supported today.
   * 
   * If you need to pass in other props, please submit a PR.
   */
  // Before actually submitting a PR, you can test out the new prop like so:
  //   import type { RouterProps } from "@solidjs/router";
  //   const routerProps = { newProp } as RouterProps;
  //   <StartClient routerProps={routerProps as unknown as undefined} />
  routerProps?: Pick<RouterProps, 'source'>
} = {}) => {
  let mockFetchEvent: PageEvent = {
    get request() {
      if (process.env.NODE_ENV === "development") {
        return throwClientError("request");
      }
    },
    get clientAddress() {
      if (process.env.NODE_ENV === "development") {
        return throwClientError("clientAddress");
      }
    },
    get locals() {
      if (process.env.NODE_ENV === "development") {
        return throwClientError("locals");
      }
    },
    get prevUrl() {
      if (process.env.NODE_ENV === "development") {
        return throwClientError("prevUrl");
      }
    },
    get responseHeaders() {
      if (process.env.NODE_ENV === "development") {
        return throwClientError("responseHeaders");
      }
    },
    get tags() {
      if (process.env.NODE_ENV === "development") {
        return throwClientError("tags");
      }
    },
    get env() {
      if (process.env.NODE_ENV === "development") {
        return throwClientError("env");
      }
    },
    get routerContext() {
      if (process.env.NODE_ENV === "development") {
        return throwClientError("routerContext");
      }
    },
    setStatusCode(code: number) {
      if (process.env.NODE_ENV === "development") {
        return throwClientError("setStatusCode");
      }
    },
    getStatusCode() {
      if (process.env.NODE_ENV === "development") {
        return throwClientError("getStatusCode");
      }
    },
    $type: FETCH_EVENT,
    fetch,
    $islands: new Set(),
    mutation: false
  };

  function StartRouter(props: RouterProps) {
    return (
      <Router {...props}></Router>
    );
  }

  const BASE_URL = import.meta.env.BASE_URL;
  let basePath = BASE_URL;
  if (BASE_URL.startsWith("http")) {
    try {
      // SolidRouter expects a pathname for the `base` prop, not a full URL.
      const url = new URL(BASE_URL);
      basePath = url.pathname;
    } catch (e) {
      console.warn('BASE_URL starts with http, but `new URL` failed to parse it. Please check your BASE_URL:', BASE_URL);
    }
  }

  return (
    <ServerContext.Provider value={mockFetchEvent}>
      <MetaProvider>
        <StartRouter base={basePath} data={dataFn} {...routerProps}>
          <Root />
        </StartRouter>
      </MetaProvider>
    </ServerContext.Provider>
  );
};
