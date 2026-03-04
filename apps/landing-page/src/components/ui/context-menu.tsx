import type { Component, ComponentProps, JSX, ValidComponent } from "solid-js";
import { omit } from "solid-js";

import * as ContextMenuPrimitive from "@kobalte/core/context-menu";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";

import { cn } from "~/lib/utils";

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuPortal = ContextMenuPrimitive.Portal;
const ContextMenuSub = ContextMenuPrimitive.Sub;
const ContextMenuGroup = ContextMenuPrimitive.Group;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const ContextMenu: Component<ContextMenuPrimitive.ContextMenuRootProps> = props => {
  return <ContextMenuPrimitive.Root gutter={4} {...props} />;
};

type ContextMenuContentProps<T extends ValidComponent = "div"> =
  ContextMenuPrimitive.ContextMenuContentProps<T> & {
    class?: string | undefined;
  };

const ContextMenuContent = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, ContextMenuContentProps<T>>,
) => {
  const others = omit(props as ContextMenuContentProps, "class");
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        class={cn(
          "z-50 min-w-32 origin-[var(--kb-menu-content-transform-origin)] overflow-hidden rounded-sm  bg-popover text-popover-foreground shadow-md animate-in",
          "bg-gradient-to-b from-blue-800/80 dark:via-blue-900 dark:to-[#081924] via-white to-white",
          (props as ContextMenuContentProps).class,
        )}
        {...others}
      />
    </ContextMenuPrimitive.Portal>
  );
};

type ContextMenuItemProps<T extends ValidComponent = "div"> =
  ContextMenuPrimitive.ContextMenuItemProps<T> & {
    class?: string | undefined;
  };

const ContextMenuItem = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, ContextMenuItemProps<T>>,
) => {
  const others = omit(props as ContextMenuItemProps, "class");
  return (
    <ContextMenuPrimitive.Item
      class={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        (props as ContextMenuItemProps).class,
      )}
      {...others}
    />
  );
};

const ContextMenuShortcut: Component<ComponentProps<"span">> = props => {
  const others = omit(props, "class");
  return <span class={cn("ml-auto text-xs tracking-widest opacity-60", props.class)} {...others} />;
};

type ContextMenuSeparatorProps<T extends ValidComponent = "hr"> =
  ContextMenuPrimitive.ContextMenuSeparatorProps<T> & {
    class?: string | undefined;
  };

const ContextMenuSeparator = <T extends ValidComponent = "hr">(
  props: PolymorphicProps<T, ContextMenuSeparatorProps<T>>,
) => {
  const others = omit(props as ContextMenuSeparatorProps, "class");
  return (
    <ContextMenuPrimitive.Separator
      class={cn("-mx-1 my-1 h-px bg-muted", (props as ContextMenuSeparatorProps).class)}
      {...others}
    />
  );
};

type ContextMenuSubTriggerProps<T extends ValidComponent = "div"> =
  ContextMenuPrimitive.ContextMenuSubTriggerProps<T> & {
    class?: string | undefined;
    children?: JSX.Element;
  };

const ContextMenuSubTrigger = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, ContextMenuSubTriggerProps<T>>,
) => {
  const others = omit(props as ContextMenuSubTriggerProps, "class", "children");
  return (
    <ContextMenuPrimitive.SubTrigger
      class={cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
        (props as ContextMenuSubTriggerProps).class,
      )}
      {...others}
    >
      {(props as ContextMenuSubTriggerProps).children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="ml-auto size-4"
      >
        <path d="M9 6l6 6l-6 6" />
      </svg>
    </ContextMenuPrimitive.SubTrigger>
  );
};

type ContextMenuSubContentProps<T extends ValidComponent = "div"> =
  ContextMenuPrimitive.ContextMenuSubContentProps<T> & {
    class?: string | undefined;
  };

const ContextMenuSubContent = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, ContextMenuSubContentProps<T>>,
) => {
  const others = omit(props as ContextMenuSubContentProps, "class");
  return (
    <ContextMenuPrimitive.SubContent
      class={cn(
        "z-50 min-w-32 origin-[var(--kb-menu-content-transform-origin)] overflow-hidden rounded-sm bg-popover p-1 text-popover-foreground shadow-md animate-in",
        "bg-gradient-to-b from-blue-800/80 dark:via-blue-900 dark:to-[#142238] via-white to-white",
        (props as ContextMenuSubContentProps).class,
      )}
      {...others}
    />
  );
};

type ContextMenuCheckboxItemProps<T extends ValidComponent = "div"> =
  ContextMenuPrimitive.ContextMenuCheckboxItemProps<T> & {
    class?: string | undefined;
    children?: JSX.Element;
  };

const ContextMenuCheckboxItem = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, ContextMenuCheckboxItemProps<T>>,
) => {
  const others = omit(props as ContextMenuCheckboxItemProps, "class", "children");
  return (
    <ContextMenuPrimitive.CheckboxItem
      class={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        (props as ContextMenuCheckboxItemProps).class,
      )}
      {...others}
    >
      <span class="absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
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
            <path d="M5 12l5 5l10 -10" />
          </svg>
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {(props as ContextMenuCheckboxItemProps).children}
    </ContextMenuPrimitive.CheckboxItem>
  );
};

type ContextMenuGroupLabelProps<T extends ValidComponent = "span"> =
  ContextMenuPrimitive.ContextMenuGroupLabelProps<T> & {
    class?: string | undefined;
  };

const ContextMenuGroupLabel = <T extends ValidComponent = "span">(
  props: PolymorphicProps<T, ContextMenuGroupLabelProps<T>>,
) => {
  const others = omit(props as ContextMenuGroupLabelProps, "class");
  return (
    <ContextMenuPrimitive.GroupLabel
      class={cn("px-2 py-1.5 text-sm font-semibold", (props as ContextMenuGroupLabelProps).class)}
      {...others}
    />
  );
};

type ContextMenuRadioItemProps<T extends ValidComponent = "div"> =
  ContextMenuPrimitive.ContextMenuRadioItemProps<T> & {
    class?: string | undefined;
    children?: JSX.Element;
  };

const ContextMenuRadioItem = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, ContextMenuRadioItemProps<T>>,
) => {
  const others = omit(props as ContextMenuRadioItemProps, "class", "children");
  return (
    <ContextMenuPrimitive.RadioItem
      class={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        (props as ContextMenuRadioItemProps).class,
      )}
      {...others}
    >
      <span class="absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-2 fill-current"
          >
            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          </svg>
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {(props as ContextMenuRadioItemProps).children}
    </ContextMenuPrimitive.RadioItem>
  );
};

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};
