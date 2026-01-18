import _ from "lodash";

export function serverFnWithNpmModule() {
  "use server";

  return _.map([1, 2, 3], x => x * 2);
}
