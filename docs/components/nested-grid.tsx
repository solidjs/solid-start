import { type JSX } from "solid-js";

const highlightStyles = "sm:col-span-2 md:row-span-2 md:col-span-1";

interface BentoItemProps {
  isHighlight?: boolean;
  title: string | JSX.Element;
  children: JSX.Element;
  accent?: "pink" | "yellow" | "cyan" | "purple" | "emerald" | "teal" | "neutral" | "lime";
}

function getAccent(accent: BentoItemProps["accent"]) {
  switch (accent) {
    case "pink":
      return {
        box: "dark:hover:border-pink-300  dark:hover:shadow-pink-200 hover:border-pink-500  hover:shadow-pink-600",
        title: "group-hover:text-pink-500 dark:group-hover:text-pink-300"
      };
    case "yellow":
      return {
        box: "hover:border-yellow-500  hover:shadow-yellow-600 dark:hover:border-yellow-300 dark:hover:shadow-yellow-200",
        title: "group-hover:text-yellow-500 dark:group-hover:text-yellow-300"
      };
    case "neutral":
      return {
        box: "hover:border-neutral-500  hover:shadow-neutral-600 dark:hover:border-neutral-300  dark:hover:shadow-neutral-200",
        title: "group-hover:text-neutral-500 dark:group-hover:text-neutral-300"
      };
    case "emerald":
      return {
        box: "hover:border-emerald-500  hover:shadow-emerald-600 dark:hover:border-emerald-300  dark:hover:shadow-emerald-200",
        title: "group-hover:text-emerald-500 dark:group-hover:text-emerald-300"
      };
    case "purple":
      return {
        box: "hover:border-purple-500  hover:shadow-purple-600 dark:hover:border-purple-300  dark:hover:shadow-purple-200",
        title: "group-hover:text-purple-500 dark:group-hover:text-purple-300"
      };
    case "lime":
      return {
        box: "hover:border-lime-500  hover:shadow-lime-600 dark:hover:border-lime-300  dark:hover:shadow-lime-200",
        title: "group-hover:text-lime-500 dark:group-hover:text-lime-300"
      };
    case "teal":
      return {
        box: "hover:border-teal-500  hover:shadow-teal-600 dark:hover:border-teal-300  dark:hover:shadow-teal-200",
        title: "group-hover:text-teal-500 dark:group-hover:text-teal-300"
      };
    case "cyan":
    default:
      return {
        box: "hover:border-cyan-500  hover:shadow-cyan-600 dark:hover:border-cyan-300  dark:hover:shadow-cyan-200",
        title: "group-hover:text-cyan-500 dark:group-hover:text-cyan-300"
      };
  }
}

export const NestItem = (props: BentoItemProps) => {
  return (
    <li
      class={`relative border-2 border-sky-950 rounded-md p-4 group transition-all shadow-inner transform hover:-translate-y-1 overflow-hidden ${
        props.isHighlight ? highlightStyles : ""
      } ${getAccent(props.accent).box}`}
    >
      <em class={`not-italic font-semibold text-lg pb-3 block ${getAccent(props.accent).title}`}>
        {props.title}
      </em>
      <p>{props.children}</p>
    </li>
  );
};

export const NesterBox = (props: { children: JSX.Element }) => {
  return <ul class="max-w-full w-full px-4 flex flex-col gap-4">{props.children}</ul>;
};
