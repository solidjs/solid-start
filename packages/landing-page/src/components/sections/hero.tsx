import { CodeSnippet } from "../code-snippet";
import { GithubIcon } from "../icons/github-icon";
import { SolidStartLogo } from "../icons/solidstart-logo";
import { buttonVariants } from "../ui/button";
const buttonOutlineStyles = buttonVariants({
  variant: "outline"
});
export function Hero() {
  return (
    <header class="w-full mx-auto pb-24 md:px-10 bg-gradient-to-b from-transparent dark:to-[#081924] via-white dark:via-white/0 to-white">
      <div class="max-w-5xl mx-auto">
        <SolidStartLogo class="drop-shadow-[10px_20px_35px_rgb(125,211,252,0.3)] size-52 md:size-[400px] mx-auto" />
        <div class="flex flex-col">
          <div class="text-center text-6xl font-semibold">
            Solid<span class="text-[#017AD4]">Start</span>
          </div>
          <strong class="dark:font-thin text-balance font-normal text-3xl block pt-3 text-center">
            Fine-grained reactivity goes fullstack
          </strong>
          <div class="pt-10 flex flex-col items-center sm:flex-row gap-4 justify-center px-6">
            <a
              href="https://github.com/solidjs/solid-start"
              class={`border-none w-max hover:shadow-[0_0_35px_rgb(125,211,252,0.3)] hover:bg-transparent ${buttonOutlineStyles}`}
              target="_blank"
              rel="noopener"
            >
              <GithubIcon />
              <span class="sr-only">SolidStart GitHub repository</span>
            </a>
            <a
              class="hover:shadow-[0_0_35px_rgb(125,211,252,0.3)] max-w-52 sm:w-max w-full py-1.5 hover:bg-transparent dark:border-sky-800 hover:border-sky-800 dark:hover:border-transparent  flex items-center justify-center  border-2 border-transparent px-4 rounded-sm dark:bg-sky-800 bg-sky-200 transition-colors ease-in-out"
              href="https://docs.solidjs.com/solid-start"
              rel="noopener"
            >
              Get Started
            </a>
            <a
              class="hover:shadow-[0_0_35px_rgb(21,126,182,0.2)] max-w-52 sm:w-max w-full py-1.5 hover:bg-transparent dark:border-sky-800 hover:border-sky-800 dark:hover:border-transparent  flex items-center justify-center  border-2 border-transparent px-4 rounded-sm dark:bg-sky-800 bg-sky-200 transition-colors ease-in-out"
              href="https://start.solid.new/"
              rel="noopener"
            >
              Try with StackBlitz
            </a>
          </div>
        </div>
      </div>
      <CodeSnippet />
    </header>
  );
}
