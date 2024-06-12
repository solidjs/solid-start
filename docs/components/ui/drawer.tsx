import type { Component, ComponentProps } from "solid-js";
import { splitProps } from "solid-js";

import * as DrawerPrimitive from "corvu/drawer";

import { cn } from "~/lib/utils";

const Drawer = DrawerPrimitive.Root;

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay: Component<DrawerPrimitive.OverlayProps> = (props) => {
  const [, rest] = splitProps(props, ["class"]);
  const drawerContext = DrawerPrimitive.useContext();
  return (
    <DrawerPrimitive.Overlay
      class={cn(
        "fixed inset-0 z-50 data-[transitioning]:transition-colors data-[transitioning]:duration-300",
        props.class
      )}
      style={{
        "background-color": `rgb(0 0 0 / ${
          0.8 * drawerContext.openPercentage()
        })`,
      }}
      {...rest}
    />
  );
};

const DrawerContent: Component<DrawerPrimitive.ContentProps> = (props) => {
  const [, rest] = splitProps(props, ["class", "children"]);
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        class={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background after:absolute after:inset-x-0 after:top-full after:h-1/2 after:bg-inherit data-[transitioning]:transition-transform data-[transitioning]:duration-300 md:select-none",
          props.class
        )}
        {...rest}
      >
        <div class="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        {props.children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
};

const DrawerHeader: Component<ComponentProps<"div">> = (props) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <div
      class={cn("grid gap-1.5 p-4 text-center sm:text-left", props.class)}
      {...rest}
    />
  );
};

const DrawerFooter: Component<ComponentProps<"div">> = (props) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <div class={cn("t-auto flex flex-col gap-2 p-4", props.class)} {...rest} />
  );
};

const DrawerTitle: Component<DrawerPrimitive.LabelProps> = (props) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <DrawerPrimitive.Label
      class={cn(
        "text-lg font-semibold leading-none tracking-tight",
        props.class
      )}
      {...rest}
    />
  );
};

const DrawerDescription: Component<DrawerPrimitive.DescriptionProps> = (
  props
) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <DrawerPrimitive.Description
      class={cn("text-sm text-muted-foreground", props.class)}
      {...rest}
    />
  );
};

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
