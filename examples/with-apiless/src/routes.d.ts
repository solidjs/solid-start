declare module "solid-start/router" {
  export interface Routes {
    "/app/blog/[id]": ReturnType<typeof import("~/routes/app/blog/[id]")["data"]>;
  }

  export function useRouterData<T extends keyof Routes>(): Routes[T];
}
