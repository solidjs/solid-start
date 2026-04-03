import type { JSX } from "solid-js";
import { ssr as ssrHtml, isServer } from "solid-js/web";
import type { StartImageSource, StartImageTransformer, StartImageVariant } from "./types";

export interface ImageProps<T> {
  src: {
    src: StartImageSource<T>
    transformer?: StartImageTransformer<T>
  }
  alt: string;
  fallback?: (visible: () => boolean, onLoad: () => void) => JSX.Element;
}

function mergeImageVariantsByType(variants: StartImageVariant[]) {
  const map = new Map<string, StartImageVariant[]>();
  for (const variant of variants) {
    const arr = map.get(variant.type) || [];
    arr.push(variant);
    map.set(variant.type, arr);
  }
  return map;
}

function mergeImageVariantsToSrcSet(variants: StartImageVariant[]) {
  return variants.map(v => `${v.path} ${v.width}w`).join(",");
}

export function Image<T>(props: ImageProps<T>): JSX.Element {
  if (isServer) {
    const variants = props.src.transformer 
      ? props.src.transformer.transform(props.src.src) 
      : [];
    const variantArray = Array.isArray(variants) ? variants : [variants];
    
    let html = `<div data-start-image="container">`;
    html += `<div data-start-image="aspect-ratio" style="position:relative;padding-top:${(props.src.src.height * 100) / props.src.src.width}%;width:100%;height:0;overflow:hidden;">`;
    html += `<picture data-start-picture="picture">`;
    
    if (variantArray.length > 0) {
      const merged = mergeImageVariantsByType(variantArray);
      for (const [type, vars] of merged) {
        const srcset = mergeImageVariantsToSrcSet(vars);
        html += `<source type="${type}" srcset="${srcset}"/>`;
      }
    }
    
    html += `<img data-start-image="image" src="${props.src.src.source}" alt="${props.alt}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;"/>`;
    html += `</picture></div></div>`;
    
    return ssrHtml(html) as unknown as JSX.Element;
  }
  
  return (
    <div data-start-image="container">
      <div 
        data-start-image="aspect-ratio" 
        style={{
          position: "relative",
          "padding-top": `${(props.src.src.height * 100) / props.src.src.width}%`,
          width: "100%",
          height: "0",
          overflow: "hidden",
        }}
      >
        <picture data-start-picture="picture">
          {props.src.transformer && (() => {
            const variants = props.src.transformer!.transform(props.src.src);
            const variantArray = Array.isArray(variants) ? variants : [variants];
            const merged = mergeImageVariantsByType(variantArray);
            return Array.from(merged).map(([type, vars]) => (
              <source 
                type={type} 
                srcset={mergeImageVariantsToSrcSet(vars)} 
              />
            ));
          })()}
          <img 
            data-start-image="image" 
            src={props.src.src.source} 
            alt={props.alt}
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
              "object-fit": "contain",
            }}
          />
        </picture>
      </div>
    </div>
  );
}
