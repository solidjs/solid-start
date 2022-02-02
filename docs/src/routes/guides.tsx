import { Outlet } from "solid-app-router";
const modules = import.meta.globEager("./guides/*.(mdx|md)");
import { For } from "solid-js";
import md from "~/md";

const pathToHumanName = (path: string) =>
    path // ./guides/page-data.md
        .split("/") // [".", "guides", "page-data.md"]
        .at(-1) // "page-data.md"
        .split(".")[0] // "page-data"
        .split("-") // ["page", "data"]
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // ["Page", "Data"]
        .join(" "); // "Page Data"



const Guides = () => {
  return (
    <md.ul>
      <For each={Object.keys(modules)}>
        {name => (
          <md.li>
            <md.a href={`/guides/${name}`}>
                {pathToHumanName(name)}
            </md.a>
          </md.li>
        )}
      </For>
    </md.ul>
  );
};

export default Guides;
