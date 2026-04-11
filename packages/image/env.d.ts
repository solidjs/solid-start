/// <reference types="vite/client" />

import type { StartImageProps } from "./dist/index";

declare module "*.jpg?image" {
  const props: StartImageProps<unknown>["src"];
  export default props;
}

declare module "*.png?image" {
  const props: StartImageProps<unknown>["src"];
  export default props;
}

declare module "*.jpeg?image" {
  const props: StartImageProps<unknown>["src"];
  export default props;
}

declare module "*.webp?image" {
  const props: StartImageProps<unknown>["src"];
  export default props;
}

declare module "*.gif?image" {
  const props: StartImageProps<unknown>["src"];
  export default props;
}

declare module "*.svg?image" {
  const props: StartImageProps<unknown>["src"];
  export default props;
}
