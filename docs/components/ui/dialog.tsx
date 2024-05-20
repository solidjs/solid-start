import type { Component, ComponentProps } from "solid-js";
import { splitProps } from "solid-js";

import { Dialog as DialogPrimitive } from "@kobalte/core";

import { cn } from "~/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger: Component<DialogPrimitive.DialogTriggerProps> = (
  props
) => {
  const [, rest] = splitProps(props, ["children"]);
  return (
    <DialogPrimitive.Trigger {...rest}>
      {props.children}
    </DialogPrimitive.Trigger>
  );
};

const DialogPortal: Component<DialogPrimitive.DialogPortalProps> = (props) => {
  const [, rest] = splitProps(props, ["children"]);
  return (
    <DialogPrimitive.Portal {...rest}>
      <div class="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
        {props.children}
      </div>
    </DialogPrimitive.Portal>
  );
};

const DialogOverlay: Component<DialogPrimitive.DialogOverlayProps> = (
  props
) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Overlay
      class={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0",
        props.class
      )}
      {...rest}
    />
  );
};

const DialogContent: Component<DialogPrimitive.DialogContentProps> = (
  props
) => {
  const [, rest] = splitProps(props, ["class", "children"]);
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        class={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 data-[closed]:slide-out-to-left-1/2 data-[closed]:slide-out-to-top-[48%] data-[expanded]:slide-in-from-left-1/2 data-[expanded]:slide-in-from-top-[48%] sm:rounded-lg",
          props.class
        )}
        {...rest}
      >
        {props.children}
        <DialogPrimitive.CloseButton class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[expanded]:bg-accent data-[expanded]:text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4"
          >
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
          </svg>
          <span class="sr-only">Close</span>
        </DialogPrimitive.CloseButton>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
};

const DialogHeader: Component<ComponentProps<"div">> = (props) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <div
      class={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        props.class
      )}
      {...rest}
    />
  );
};

const DialogFooter: Component<ComponentProps<"div">> = (props) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <div
      class={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        props.class
      )}
      {...rest}
    />
  );
};

const DialogTitle: Component<DialogPrimitive.DialogTitleProps> = (props) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Title
      class={cn(
        "text-lg font-semibold leading-none tracking-tight",
        props.class
      )}
      {...rest}
    />
  );
};

const DialogDescription: Component<DialogPrimitive.DialogDescriptionProps> = (
  props
) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Description
      class={cn("text-sm text-muted-foreground", props.class)}
      {...rest}
    />
  );
};

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
