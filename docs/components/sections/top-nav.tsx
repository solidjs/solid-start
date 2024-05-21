import { DiscordIcon } from "../icons/discord-icon";
import { ThemeToggle } from "../theme-toggle";

export function TopNav() {
  return (
    <nav class="w-full sticky top-0 backdrop-blur-lg py-4 z-20 bg-sky-800/75  dark:bg-transparent">
      <div class="max-w-5xl w-full px-4 mx-auto flex justify-between">
        <a href="https://discord.gg/solidjs" target="_blank">
          <DiscordIcon />
          <span class="sr-only">Invitation to SolidJS discord server</span>
        </a>
        {/* <SolidStartLogo class="w-10 h-10 grayscale" /> */}
        <ThemeToggle />
      </div>
    </nav>
  );
}
