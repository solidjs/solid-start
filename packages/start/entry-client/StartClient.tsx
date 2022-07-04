import { MetaProvider } from "solid-meta";
import { Router } from "solid-app-router";
import { ServerContext } from "../server/ServerContext";
import Root from "~/root";
import { FETCH_EVENT, PageEvent } from "../server/types";

const rootData = Object.values(import.meta.globEager("/src/root.data.(js|ts)"))[0];
const dataFn = rootData ? rootData.default : undefined;

function throwClientError(field: string): any {
  throw new Error(
    `"${field}" is not available on the client. Use it within an \`if (isServer)\` block to ensure it only runs on the server`
  );
}

export default () => {
  let mockFetchEvent: PageEvent = {
    get request() {
      if (process.env.NODE_ENV === "development") {
        return throwClientError("request");
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
    fetch
  };

  return (
    <ServerContext.Provider value={mockFetchEvent}>
      <MetaProvider>
        <Router data={dataFn}>
          <Root />
        </Router>
      </MetaProvider>
    </ServerContext.Provider>
  );
};
