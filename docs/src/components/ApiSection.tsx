import { Component, JSX } from "solid-js";
import md from "~/md";

const ApiSection: Component<{ name: string; description: JSX.Element; }> = props => {
  return (
    <section class="bg-gray-100 border-2 shadow-lg p-2 my-4 rounded-lg">
      <md.h2>{props.name}</md.h2>

      <md.p>{props.description}</md.p>

      {props.children}
    </section>
  );
};

export default ApiSection;
