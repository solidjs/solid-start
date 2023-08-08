// @ts-expect-error
var routeLayouts = $ROUTE_LAYOUTS;

var layouts = routeLayouts as {
  [key: string]: {
    layouts: string[];
    id: string;
  };
};

export { layouts as routeLayouts };
