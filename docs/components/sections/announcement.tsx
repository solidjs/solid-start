import { GithubIcon } from "~/components/icons/github-icon";
import { SectionTitle } from "../ui/section-title";

export function Announcement() {
  return (
    <section class="max-w-5xl w-full mx-auto pt-12 relative group">
      <header>
        <SectionTitle stylesOverride="group-hover:shake-it">
          Announcing <span class="font-mono dark:text-sky-100/90 text-sky-950">v1</span> Release
        </SectionTitle>
      </header>
      <div
        class="relative w-full overflow-x-clip flex justify-center items-center opacity-25 top-24"
        role="presentation"
      >
        <div class="sonar relative w-24 h-24 rounded-full -z-10" />
      </div>
      <ul class="grid grid-rows-2 place-items-center items-stretch lg:w-1/2 mx-auto lg:grid-rows-1 lg:grid-cols-2 lg:gap-10 gap-24">
        <li>
          <a
            class="flex flex-col justify-center items-center gap-4 text-lg text-center w-60 h-full border-2 rounded-md py-4 px-2 dark:border-sky-950 border-sky-200 hover:border-sky-700 dark:hover:border-sky-200 z-10 relative"
            href="https://github.com/solidjs/solid-start"
            target="_blank"
          >
            <span class="sr-only">GitHub</span>
            <GithubIcon class="absolute -top-12 -left-5 lg:-top-16 lg:left-[unset] h-[5rem]  group-hover:dark:bg-sky-950/95 dark:bg-transparent bg-white rounded-full text-sky-800 dark:text-white" />
            <span>Release notes</span>
          </a>
        </li>
        <li>
          <a
            class="group flex flex-col justify-center items-center gap-4 text-lg text-center  border-2 rounded-md py-4 px-2 dark:border-sky-950 border-sky-200 hover:border-sky-700 dark:hover:border-sky-200 z-10 relative"
            href="https://www.solidjs.com/blog/solid-start-the-shape-frameworks-to-come"
            target="_blank"
          >
            <div class="h-[5rem] absolute -top-12 -right-5  lg:-top-1/2  lg:right-[unset]">
              <img class="h-full aspect-auto" src="/ryan-carniato.webp" role="presentation" />
              <img
                class="h-full aspect-auto absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                src="/ryan-carniato-sunglasses.webp"
                role="presentation"
              />
            </div>
            <div>
              <span class="sr-only">Blog post</span>
              <span class="block pt-2">SolidStart 1.0:</span>
              <span class="text-base">The Shape of Frameworks to Come</span>
            </div>
          </a>
        </li>
      </ul>
    </section>
  );
}
