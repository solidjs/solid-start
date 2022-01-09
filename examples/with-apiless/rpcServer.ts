const actionModules = import.meta.globEager("/src/**/*.api.(js|ts)");

const NAMESPACE = /([^\/\.]+)\.api/;

console.log(actionModules);
export const actions = Object.entries<Record<string, any>>(actionModules).reduce(
  (memo, [name, actions]) => {
    const prefix = name.replace(".api.ts", "") + "/";
    Object.keys(actions).forEach(key => (memo[prefix + key] = actions[key]));
    return memo;
  },
  {}
);

// export default async function renderActions(url: string, body: any) {
//   if (!url.startsWith("/actions/")) return;
//   const command = url.slice(9);
//   const fn = actions[command];
//   if (!fn)
//     return {
//       status: 404,
//       body: "Not Found"
//     };
//   try {
//     const data = await fn(...body);
//     return {
//       status: 200,
//       body: JSON.stringify({ data })
//     };
//   } catch (error) {
//     return {
//       status: 500,
//       error
//     };
//   }
// }
