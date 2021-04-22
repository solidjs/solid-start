const actionModules = import.meta.globEager("/src/actions/**/*.(js|ts)");

const actions = Object.values<{ default: any }>(actionModules).reduce((memo, actions) => {
  return Object.assign(memo, actions.default);
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
