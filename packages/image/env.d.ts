/// <reference types="vite/client" />

import type { ImageProps } from "./dist/index";

declare module "*.jpg?image" {
  const props: Pick<ImageProps<unknown>, "src" | "transformer">;
  export default props;
}

declare module "*.png?image" {
  const props: Pick<ImageProps<unknown>, "src" | "transformer">;
  export default props;
}

declare module "*.jpeg?image" {
  const props: Pick<ImageProps<unknown>, "src" | "transformer">;
  export default props;
}

declare module "*.webp?image" {
  const props: Pick<ImageProps<unknown>, "src" | "transformer">;
  export default props;
}

declare module "*.gif?image" {
  const props: Pick<ImageProps<unknown>, "src" | "transformer">;
  export default props;
}

declare module "*.svg?image" {
  const props: Pick<ImageProps<unknown>, "src" | "transformer">;
  export default props;
}
