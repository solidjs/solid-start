import { splitProps } from "solid-js";

import { TabsContentProps, TabsIndicatorProps, TabsListProps, Tabs as TabsPrimitive, TabsTriggerProps } from "@kobalte/core/tabs";

import { cn } from "~/lib/utils";
import { OverrideComponentProps } from "@kobalte/utils";

const Tabs = TabsPrimitive;

const TabsList = (props: OverrideComponentProps<"div", TabsListProps>) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.List
      class={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        props.class
      )}
      {...rest}
    />
  );
};

const TabsTrigger = (props: OverrideComponentProps<"button", TabsTriggerProps>) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Trigger
      class={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-sm",
        props.class
      )}
      {...rest}
    />
  );
};

const TabsContent = (props: OverrideComponentProps<"div", TabsContentProps>) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Content
      class={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        props.class
      )}
      {...rest}
    />
  );
};

const TabsIndicator = (props: OverrideComponentProps<"div", TabsIndicatorProps>) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Indicator
      class={cn(
        "duration-250ms absolute transition-all data-[orientation=horizontal]:bottom-[-1px] data-[orientation=vertical]:right-[-1px] data-[orientation=horizontal]:h-[2px] data-[orientation=vertical]:w-[2px]",
        props.class
      )}
      {...rest}
    />
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator };
