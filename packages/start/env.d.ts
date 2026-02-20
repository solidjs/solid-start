// This file contains global type definitions that are exported as @solidjs/start/env

/// <reference types="vite/client" />

declare namespace App {
  export interface RequestEventLocals {
    [key: string | symbol]: any;
  }
}

declare module 'image:*' {
  import type { StartImageProps } from "./src/image.ts";

  const props: Pick<StartImageProps<unknown>, 'src' | 'transformer'>;

  export default props;
}

declare module '*?image' {
  import type { StartImageProps } from "./src/image.ts";

  const props: Pick<StartImageProps<unknown>, 'src' | 'transformer'>;

  export default props;
}
