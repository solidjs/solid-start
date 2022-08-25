import { server } from "./server-functions/browser";

export default server;

export const isServerFunctionRequest = () => {
  throw new Error("isServerFunctionRequest is not supported on the browser");
};

export * from "./shared";
