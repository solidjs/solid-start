import { createTRPCClient } from "@trpc/client";
import { isServer } from "solid-js/web";
let resolver;

if (isServer) {
  console.log("hereeee");
  const { actions } = await import("../rpcServer");
  resolver = async path => {
    console.log("heree 2");
    console.log(path, actions[path]);
    const data = await actions[path.replace("__api", "")]();
    console.log("got data", data);
    return data;
  };
} else {
  const client = createTRPCClient({
    url: "http://localhost:3000"
  });

  resolver = client.query.bind(client);
}

export const createClientResolver = (path, request) => {
  return async () => {
    return await resolver(path.slice(1) + "/" + request);
  };
};
