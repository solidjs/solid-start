import { hydrate } from "solid-js/web";
import { StartClient } from "solid-start/components";

// function logger({ onLog }) {
//   return ({ ctx, next }) => {
//     return async req => {
//       onLog("request", req);
//       const response = await next(req);
//       onLog("response", response);
//       return response;
//     };
//   };
// }

// function auth() {
//   return ({ ctx, next }) => {
//     return async req => {
//       ctx.headers = {
//         Authorization: "Bearer solidjs"
//       };
//       const response = await next(req);
//       return response;
//     };
//   };
// }

// server.setClientMiddleware(logger({ onLog: console.log }), auth());

hydrate(() => <StartClient />, document);
