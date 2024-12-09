import { LegoSVG } from "~/components/icons/lego-icon";
import { NesterBox, NestItem } from "../nested-grid";
import { SectionTitle } from "../ui/section-title";

export function MetaFramework() {
  return (
    <section class="max-w-5xl w-full mx-auto pt-12 md:pt-28 group">
      <header>
        <SectionTitle>Composable Meta-framework</SectionTitle>
        <p class="pt-5 px-2 leading-relaxed max-w-[70ch] mx-auto text-center dark:font-thin text-lg">
          SolidStart integrates multiple separate packages to provide a complete functionality. Each
          of these pieces can be replaced with your own implementation.
        </p>
      </header>
      <div class="pt-12 lg:pt-0 grid grid-rows-[auto,auto] lg:grid-rows-1 lg:grid-cols-[auto,auto] place-items-center gap-0">
        <NesterBox>
          <NestItem accent="purple" title="Seroval">
            <p>A strong, highly-performant serializer.</p>
          </NestItem>

          <NestItem isHighlight accent="neutral" title="Vinxi">
            <p class="leading-relaxed text-lg">Bundler and server runtime</p>
            <ul class="grid grid-cols-2 gap-2 pt-5">
              <NestItem title="Vite" accent="yellow">
                <p>Dev env and bundler</p>
              </NestItem>
              <NestItem title="Nitro" accent="teal">
                <p>server APIs and presets</p>
              </NestItem>
            </ul>
          </NestItem>

          <NestItem title="Solid Router" accent="pink">
            <p>Official client-side router.</p>
          </NestItem>
        </NesterBox>
        <div class="w-full grid place-items-center overflow-x-hidden">
          <LegoSVG />
        </div>
      </div>
    </section>
  );
}
