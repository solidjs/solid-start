declare interface StartRoutes {
  "/notes/[note]": {
    params: "note";
    data: typeof import("./src/routes/notes/[note]/edit/index").routeData;
  };
}
