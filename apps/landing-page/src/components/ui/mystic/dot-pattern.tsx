import { type Component, type JSX, createUniqueId, mergeProps, splitProps } from "solid-js";

import { cn } from "~/lib/utils";

export interface DotPatternProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  cr?: number;
}

export const DotPattern: Component<DotPatternProps> = props => {
  const [_localProps, forwardProps] = splitProps(props, [
    "width",
    "height",
    "x",
    "y",
    "cx",
    "cy",
    "cr",
    "class"
  ]);
  const localProps = mergeProps(
    {
      width: 16,
      height: 16,
      x: 0,
      y: 0,
      cx: 1,
      cy: 1,
      cr: 1
    },
    _localProps
  );
  const id = createUniqueId();

  return (
    <svg
      aria-hidden="true"
      class={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-neutral-400/80",
        localProps.class
      )}
      {...forwardProps}
    >
      <defs>
        <pattern
          id={id}
          width={localProps.width}
          height={localProps.height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={localProps.x}
          y={localProps.y}
        >
          <circle id="pattern-circle" cx={localProps.cx} cy={localProps.cy} r={localProps.cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" stroke-width={0} fill={`url(#${id})`} />
    </svg>
  );
};
