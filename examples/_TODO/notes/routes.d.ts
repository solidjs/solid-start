declare interface StartRoutes {
  "/notes/[note]": {
    params: "note";
    data: typeof import("./src/routes/(layout)/notes/[note]/edit/index").routeData;
  };
}
