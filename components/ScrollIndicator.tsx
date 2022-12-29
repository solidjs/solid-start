import { createVisibilityObserver } from "@solid-primitives/intersection-observer";
import { createElementSize } from "@solid-primitives/resize-observer";
import { createContext, createSignal, onMount, Setter, useContext } from "solid-js";

// This component expects to wrap the children of a scrolling parent element.
// 
// The styles for the parent element containing this component:
//  - Should be position: relative to catch the absolute scroll indicator.
//  - Should be overflow: auto or a fixed/limited height to activate scrolling.
//  - Should probably have no right padding that would displace inner scrollbar.
// 
// See an example of this CSS pattern on the playground:
//  - https://playground.solidjs.com/anonymous/14573acd-9f44-408c-ae5e-017105d680c1
// 
// Children components can set as active via context (useScrollIndicator):
// 
//  import { createEffect } from "solid-js";
//  import { useScrollIndicator } from "./ScrollIndicator";
//  export default (props) => {
//    let ref: HTMLElement | undefined;
//    const setActiveEl = useScrollIndicator();
//    return <div ref={ref} onClick={() => { setActiveEl(ref) }}>Activate!</div>
//  }

const ScrollIndicatorContext = createContext<Setter<HTMLElement>>();

export default function ScrollIndicator(props) {
  let navSize: { height: any; width?: number; };
  let containerEl: HTMLDivElement | undefined;

  const [activeEl, setActiveEl] = createSignal<HTMLElement | undefined>();
  const activeElIsVisible = createVisibilityObserver({ threshold: 0.5 })(activeEl);

  onMount(() => {
    navSize = createElementSize(containerEl.parentElement.parentElement);
  });

  return (
    <div class={props.class} ref={containerEl} style={{
      overflow: "auto",
      height: "100%"
    }}>
      <span style={{
        right: 0,
        position: "absolute",
        "pointer-events": "none",
        width: `${props.width || 10}px`,
        height: `${props.height || 5}px`,
        display: activeElIsVisible() && !props.noHide ? "none" : "block",
        background: `${props.color || "lightgray"}`,
        top: `${Math.ceil((activeEl()?.offsetTop * navSize?.height) / containerEl?.scrollHeight) || -999}px`,
      }}></span>
      <ScrollIndicatorContext.Provider value={setActiveEl}>
        {props.children}
      </ScrollIndicatorContext.Provider>
    </div>
  );
}

export function useScrollIndicator() { return useContext(ScrollIndicatorContext); }
