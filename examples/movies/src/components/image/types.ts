import { JSX } from "solid-js";
import { ImageConfigComplete } from "./image-config";
import { VALID_LOADING_VALUES } from "./utils";

export type ImageConfig = ImageConfigComplete & { allSizes: number[] };
export type ImgElementWithDataProp = HTMLImageElement & {
  "data-loaded-src": string | undefined;
};

export type LoadingValue = typeof VALID_LOADING_VALUES[number];
export type PlaceholderValue = "blur" | "empty";
export type OnLoadingComplete = (img: HTMLImageElement) => void;
export type ImgElementStyle = NonNullable<JSX.IntrinsicElements["img"]["style"]>;
export type GenImgAttrsData = {
  config: ImageConfig;
  src: string;
  unoptimized: boolean;
  loader: ImageLoaderWithConfig;
  width?: number;
  quality?: number;
  sizes?: string;
};
export type GenImgAttrsResult = {
  src: string;
  srcSet: string | undefined;
  sizes: string | undefined;
};
export interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
  blurWidth?: number;
  blurHeight?: number;
}
export interface StaticRequire {
  default: StaticImageData;
}
export type StaticImport = StaticRequire | StaticImageData;
export type ImageProps = Omit<
  JSX.IntrinsicElements["img"],
  "src" | "srcSet" | "ref" | "alt" | "width" | "height" | "loading"
> & {
  /** @see [Device sizes documentation](https://nextjs.org/docs/api-reference/next/image#device-sizes) */
  deviceSizes: number[];

  /** @see [Image sizing documentation](https://nextjs.org/docs/basic-features/image-optimization#image-sizing) */
  imageSizes: number[];

  src: string | StaticImport;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  quality?: number | string;
  priority?: boolean;
  loading?: LoadingValue;
  placeholder?: PlaceholderValue;
  blurDataURL?: string;
  unoptimized?: boolean;
  loader?: ImageLoader;
  onLoad?: (event) => void;
  onError?: (event) => void;
  onLoadingComplete?: OnLoadingComplete;
};
export type ImageElementProps = Omit<ImageProps, "src" | "alt" | "loader"> & {
  srcString: string;
  imgAttributes: GenImgAttrsResult;
  class: string;
  heightInt: number | undefined;
  widthInt: number | undefined;
  qualityInt: number | undefined;
  imgStyle: ImgElementStyle;
  blurStyle: ImgElementStyle;
  isLazy: boolean;
  fill?: boolean;
  loading: LoadingValue;
  config: ImageConfig;
  unoptimized: boolean;
  placeholder: PlaceholderValue;
  onLoad?: (event) => void;
  onError?: (event) => void;
  loader: ImageLoaderWithConfig;
  onLoadingComplete: OnLoadingComplete | undefined;
  setBlurComplete: (b: boolean) => void;
  setShowAltText: (b: boolean) => void;
};
export type ImageLoaderWithConfig = (p: ImageLoaderPropsWithConfig) => string;
export type ImageLoaderPropsWithConfig = ImageLoaderProps & {
  config: Readonly<ImageConfig>;
};
export type ImageLoader = (p: ImageLoaderProps) => string;
export type ImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};
