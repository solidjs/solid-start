declare module "env:server" {
  export const SERVER_EXAMPLE: string;
}
declare module "env:server/runtime" {
  const env: {
    NODE_ENV: string;
  };

  export default env;
}
