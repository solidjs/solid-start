import { CodeSnippet } from "../code-snippet";
import { GithubIcon } from "../icons/github-icon";
import { SolidStartLogo } from "../icons/solidstart-logo";
import { buttonVariants } from "../ui/button";
const buttonOutlineStyles = buttonVariants({
  variant: "outline",
});
export function Hero() {
  return (
    <header class="w-full mx-auto pb-24 md:px-10 bg-gradient-to-b from-transparent dark:to-[#081924] via-white dark:via-white/0 to-white">
      <div class="max-w-5xl mx-auto">
        <SolidStartLogo class="drop-shadow-[10px_20px_35px_rgb(125,211,252,0.3)] w-full" />
        <div class=" flex flex-col">
          <h1 class="dark:text-white text-6xl text-center">SolidStart</h1>
          <strong class="dark:font-thin font-normal text-3xl block pt-8 text-center">
            Fine-Grained Reactivity goes fullstack
          </strong>
          <div class="pt-7 flex gap-4 justify-center">
            <a
              href="https://github.com/solidjs/solid-start"
              class={`border-none hover:shadow-[0_0_35px_rgb(125,211,252,0.3)] hover:bg-transparent ${buttonOutlineStyles}`}
              target="_blank"
              rel="noopener"
            >
              <GithubIcon />
            </a>
            <a
              class="hover:shadow-[0_0_35px_rgb(125,211,252,0.3)]  hover:bg-transparent dark:border-sky-800 hover:border-sky-800 dark:hover:border-transparent  flex items-center justify-center  border-2 border-transparent px-4 rounded-sm dark:bg-sky-800 bg-sky-200 transition-colors ease-in-out"
              href="https://docs.solidjs.com/solid-start"
              rel="noopener"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
      <CodeSnippet />
    </header>
  );
}
