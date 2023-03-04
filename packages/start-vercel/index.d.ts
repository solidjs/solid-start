export type PrerenderFunctionConfig = {
  expiration: number | false;
  group?: number;
  bypassToken?: string;
  fallback?: string;
  allowQuery?: string[];
};

export type SolidStartVercelOptions = {
  /**
   * @default false
   */
  edge?: boolean;
  includes?: string | string[];
  excludes?: string | string[];
  prerender?: PrerenderFunctionConfig;
};

type ViteAdapter = import("solid-start/vite").Adapter;
export default function (props: SolidStartVercelOptions): ViteAdapter;
export default function (): ViteAdapter;
