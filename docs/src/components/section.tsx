import { type JSX } from "solid-js";

interface SectionProps {
  children: JSX.Element;
  title: string;
}
export const Section = (props: SectionProps) => {
  return (
    <section class="max-w-5xl w-full mx-auto pt-20 flex flex-col gap-7">
      <h2 class="text-3xl text-center font-thin">{props.title}</h2>
      {props.children}
    </section>
  );
};
