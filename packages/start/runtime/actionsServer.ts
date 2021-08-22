const actionModules = import.meta.globEager("/src/**/*.actions.(js|ts)");

const NAMESPACE = /([^\/\.]+)\.actions/;
const actions = Object.entries<Record<string, any>>(actionModules).reduce((memo, [name, actions]) => {
  const prefix = NAMESPACE.exec(name)[1] + "/";
  Object.keys(actions).forEach(key => memo[prefix + key] = actions[key]);
  return memo;
}, {});

export default async function renderActions(url: string, body: any) {
  if (!url.startsWith("/actions/")) return;
  const command = url.slice(9);
  const fn = actions[command];
  if (!fn)
    return {
      status: 404,
      body: "Not Found"
    };
  try {
    const data = await fn(...body);
    return {
      status: 200,
      body: JSON.stringify({ data })
    };
  } catch (error) {
    return {
      status: 500,
      error
    };
  }
}
