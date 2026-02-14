import type { JSX } from "solid-js";
import { createMemo, createSignal, For, Show } from "solid-js";
import { ClientOnly } from "./client-only.tsx";
import { createLazyRender } from "./create-lazy-render.ts";
import {
  createImageVariants,
  mergeImageVariantsByType,
  mergeImageVariantsToSrcSet,
} from "./transformer.ts";
import type { StartImageSource, StartImageTransformer, StartImageVariant } from "./types.ts";
import { getAspectRatioBoxStyle } from "./utils.ts";

import "./styles.css";

export interface StartImageProps<T> {
  src: StartImageSource<T>;
  alt: string;
  transformer?: StartImageTransformer<T>;

  onLoad?: () => void;
  fallback: (visible: () => boolean, onLoad: () => void) => JSX.Element;

  crossOrigin?: JSX.HTMLCrossorigin | undefined;
  fetchPriority?: "high" | "low" | "auto" | undefined;
  decoding?: "sync" | "async" | "auto" | undefined;
}

interface StartImageSourcesProps<T> extends StartImageProps<T> {
  variants: StartImageVariant[];
}

function StartImageSources<T>(props: StartImageSourcesProps<T>): JSX.Element {
  const mergedVariants = createMemo(() => {
    const types = mergeImageVariantsByType(props.variants);

    const values: [type: string, srcset: string][] = [];

    for (const [key, variants] of types) {
      values.push([key, mergeImageVariantsToSrcSet(variants)]);
    }

    return values;
  });

  return (
    <For each={mergedVariants()}>{([type, srcset]) => <source type={type} srcset={srcset} />}</For>
  );
}

export function StartImage<T>(props: StartImageProps<T>): JSX.Element {
  const [showPlaceholder, setShowPlaceholder] = createSignal(true);
  const laze = createLazyRender<HTMLDivElement>();
  const [defer, setDefer] = createSignal(true);

  function onPlaceholderLoad() {
    setDefer(false);
  }

  const width = createMemo(() => props.src.width);
  const height = createMemo(() => props.src.height);

  return (
    <div ref={laze.ref} data-start-image="container">
      <div
        data-start-image="aspect-ratio"
        style={getAspectRatioBoxStyle({
          width: width(),
          height: height(),
        })}
      >
        <picture data-start-image="picture">
          <Show when={props.transformer} fallback={<source src={props.src.source} />}>
            {cb => <StartImageSources variants={createImageVariants(props.src, cb())} {...props} />}
          </Show>
          <ClientOnly
            fallback={
              <img
                data-start-image="image"
                alt={props.alt}
                crossOrigin={props.crossOrigin}
                fetchpriority={props.fetchPriority}
                decoding={props.decoding}
              />
            }
          >
            <Show when={laze.visible}>
              <img
                data-start-image="image"
                // src={getEmptyImageURL({
                //   width: width(),
                //   height: height(),
                // })}
                alt={props.alt}
                onLoad={() => {
                  if (!defer()) {
                    setShowPlaceholder(false);
                    props.onLoad?.();
                  }
                }}
                style={{
                  opacity: showPlaceholder() ? 0 : 1,
                }}
                crossOrigin={props.crossOrigin}
                fetchpriority={props.fetchPriority}
                decoding={props.decoding}
              />
            </Show>
          </ClientOnly>
        </picture>
      </div>
      <div data-start-image="blocker">
        <ClientOnly>
          <Show when={laze.visible}>{props.fallback(showPlaceholder, onPlaceholderLoad)}</Show>
        </ClientOnly>
      </div>
    </div>
  );
}
