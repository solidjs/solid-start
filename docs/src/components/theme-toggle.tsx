import { useColorMode } from "@kobalte/core/color-mode";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { SunIcon } from "./icons/sun-icon";
import { MoonIcon } from "./icons/moon-icon";
import { MonitorIcon } from "./icons/monitor-icon";

export function ThemeToggle() {
  const { setColorMode } = useColorMode();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger as={Button} variant="ghost" size="sm" class="group w-9 px-0">
          <SunIcon class="size-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
          <MoonIcon class="absolute size-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
          <span class="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem class="focus:text-slate-200" onSelect={() => setColorMode("light")}>
          <SunIcon class="mr-2 size-4 dark:text-slate-200 dark:group-hover:text-slate-300" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem class="focus:text-slate-200" onSelect={() => setColorMode("dark")}>
          <MoonIcon class="mr-2 size-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem class="focus:text-slate-200" onSelect={() => setColorMode("system")}>
          <MonitorIcon class="mr-2 size-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
