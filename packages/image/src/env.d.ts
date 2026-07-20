declare module "image:*" {
  import type { SolidImageProps } from "./core/index.ts";

  const props: Pick<SolidImageProps<unknown>, "src" | "transformer">;

  export default props;
}

declare module "*?image" {
  import type { SolidImageProps } from "./core/index.ts";

  const props: Pick<SolidImageProps<unknown>, "src" | "transformer">;

  export default props;
}
