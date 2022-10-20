export { server$ as default } from "./server-functions/browser";
export * from "./shared";

export const isServerFunctionRequest = () => {
  throw new Error("isServerFunctionRequest is not supported on the browser");
};


