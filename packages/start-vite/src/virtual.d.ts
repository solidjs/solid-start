declare module "solid-start:server-manifest" {
  interface Manifest {
    clientEntry: string;
  }

  export const manifest: Manifest;
}

declare module "solid-start:client-prod-manifest" {
  type Manifest = Record<string, { output: string }>;

  export default {} as Manifest;
}
