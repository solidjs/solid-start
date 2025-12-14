import { CodeSnippet } from "../code-snippet";
import { DownloadLogosMenu } from "../download-logos-menu";
import { GithubIcon } from "../icons/github-icon";
import { buttonVariants } from "../ui/button";

import { AnimatedShinyText } from "../ui/mystic/shine";

const buttonOutlineStyles = buttonVariants({
  variant: "outline",
});

export function Hero() {
  return (
    <header class="w-full mx-auto md:px-10 bg-gradient-to-b from-transparent dark:to-[#081924] via-white dark:via-white/0 to-white">
      <div class="flex flex-col items-center justify-center">
        <a
          href="https://github.com/solidjs/solid-start/discussions/1960"
          target="_blank"
          rel="noopener"
          class="inline-block px-4 py-1 group rounded-full border border-black/5 text-base text-white transition-all ease-in dark:border-white/15 dark:bg-neutral-900/30 dark:hover:bg-neutral-800/20"
        >
          <AnimatedShinyText>
            <span>✨ Public Roadmap - DeVinxi and Beyond</span>
          </AnimatedShinyText>
        </a>
      </div>
      <div class="max-w-5xl mx-auto">
        <DownloadLogosMenu />
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
