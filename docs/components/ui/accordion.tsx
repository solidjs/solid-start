import { splitProps } from "solid-js";

import { AccordionContentProps, AccordionItemProps, Accordion as AccordionPrimitive, AccordionTriggerProps } from "@kobalte/core/accordion";

import { cn } from "~/lib/utils";
import { OverrideComponentProps } from "@kobalte/utils";

const Accordion = AccordionPrimitive;

const AccordionItem = (
  props: OverrideComponentProps<"div", AccordionItemProps>
) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <AccordionPrimitive.Item
      class={cn(
        "border-b max-w-prose mx-auto last-of-type:border-none",
        props.class
      )}
      {...rest}
    />
  );
};

const AccordionTrigger = (
  props: OverrideComponentProps<"button", AccordionTriggerProps>
) => {
  const [, rest] = splitProps(props, ["class", "children"]);
  return (
    <AccordionPrimitive.Header class="flex">
      <AccordionPrimitive.Trigger
        class={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all  [&[data-expanded]>svg]:rotate-180",
          props.class
        )}
        {...rest}
      >
        {props.children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4 shrink-0 transition-transform duration-200 ml-5"
        >
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
};

const AccordionContent = (
  props: OverrideComponentProps<"div", AccordionContentProps>
) => {
  const [, rest] = splitProps(props, ["class", "children"]);
  return (
    <AccordionPrimitive.Content
      class={cn(
        "animate-accordion-up overflow-hidden text-sm transition-all data-[expanded]:animate-accordion-down",
        props.class
      )}
      {...rest}
    >
      <div class="pb-4 pt-0">{props.children}</div>
    </AccordionPrimitive.Content>
  );
};

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
