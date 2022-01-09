declare module "virtual:solid-start/routes" {
  import { RouteDefinition } from "solid-app-router";
  const routes: RouteDefinition | RouteDefinition[];
  export default routes;
}

declare module "virtual:solid-start/pages" {
  const pages: { [key: string]: () => Promise<any> };
  export default pages;
}

declare module "virtual:solid-start/data" {
  const data: { [key: string]: () => any };
  export default data;
}
