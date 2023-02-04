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
export default function (props: SolidStartVercelOptions): import("solid-start/vite").Adapter;
