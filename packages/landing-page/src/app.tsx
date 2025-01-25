// @refresh reload
import {
  ColorModeProvider,
  ColorModeScript,
  cookieStorageManagerSSR
} from "@kobalte/core/color-mode";
import { isServer } from "solid-js/web";
import { getCookie } from "vinxi/http";
import { Announcement } from "~/components/sections/announcement";
import { DeployAnywhere } from "~/components/sections/deploy-anywhere";
import { Footer } from "~/components/sections/footer";
import { Hero } from "~/components/sections/hero";
import { MetaFramework } from "~/components/sections/meta-framework";
import { RockSolidDX } from "~/components/sections/rock-solid-dx";
import { TopNav } from "~/components/sections/top-nav";
import "./fonts.css";
import "./root.css";

function getServerCookies() {
  "use server";
  const colorMode = getCookie("kb-color-mode");
  return colorMode ? `kb-color-mode=${colorMode}` : "";
}

export default function App() {
  const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);

  return (
    <>
      <ColorModeScript storageType={storageManager.type} />
      <ColorModeProvider storageManager={storageManager}>
        <main class="min-h-screen h-full grid grid-rows-[auto,1fr,auto] place-items-center relative bg-gradient-to-b dark:from-sky-950 from-sky-800 to-sky-200 dark:to-[#081924]">
          <TopNav />
          <Hero />
          <article class="w-full flex flex-col bg-white dark:bg-gradient-to-b dark:from-[#081924] from-white dark:via-[#081924] via-white dark:to-sky-950 to-sky-300">
            <Announcement />
            <MetaFramework />
            <RockSolidDX />
            <DeployAnywhere />
          </article>
          <Footer />
        </main>
      </ColorModeProvider>
    </>
  );
}
