/// <reference types="vite/client" />


/**
 * @warning do not copy this pattern in your apps
 * 
 * duplicating types from @solidjs/image/env
 * because we can't consume it within the monorepo due to the relative import
 * in env.d.ts
 */
type StartImageMIME =
  | "image/avif"
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/tiff";

interface StartImageVariant {
  path: string;
  width: number;
  type: StartImageMIME;
}

interface StartImageSource<T> {
  source: string;
  width: number;
  height: number;
  options: T;
}

interface StartImageTransformer<T> {
  transform: (source: StartImageSource<T>) => StartImageVariant | StartImageVariant[];
}

declare module "*.jpg?image" {
  const props: { src: StartImageSource<unknown>; transformer?: StartImageTransformer<unknown> };
  export default props;
}

declare module "*.png?image" {
  const props: { src: StartImageSource<unknown>; transformer?: StartImageTransformer<unknown> };
  export default props;
}

declare module "*.jpeg?image" {
  const props: { src: StartImageSource<unknown>; transformer?: StartImageTransformer<unknown> };
  export default props;
}

declare module "*.webp?image" {
  const props: { src: StartImageSource<unknown>; transformer?: StartImageTransformer<unknown> };
  export default props;
}

declare module "*.gif?image" {
  const props: { src: StartImageSource<unknown>; transformer?: StartImageTransformer<unknown> };
  export default props;
}

declare module "*.svg?image" {
  const props: { src: StartImageSource<unknown>; transformer?: StartImageTransformer<unknown> };
  export default props;
}
