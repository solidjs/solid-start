import { LegoSVG } from "~/components/icons/lego-icon";
import { NesterBox, NestItem } from "../nested-grid";
import { SectionTitle } from "../ui/section-title";

export function MetaFramework() {
  return (
    <section class="max-w-5xl w-full mx-auto pt-12 md:pt-28 group">
      <header>
        <SectionTitle>Composable Meta-framework</SectionTitle>
        <p class="pt-5 px-2 leading-relaxed max-w-[70ch] mx-auto text-center dark:font-thin text-lg w-full md:w-3/5">
          SolidStart integrates multiple separate packages to provide a complete functionality. Each
          of these pieces can be replaced with your own implementation.
        </p>
      </header>
      <div class="pt-12 lg:pt-0 grid grid-rows-[auto_auto] lg:grid-rows-1 lg:grid-cols-[auto_auto] place-items-center gap-0">
        <NesterBox>
          <NestItem accent="purple" title="Seroval">
            <p>A strong, highly-performant serializer.</p>
          </NestItem>

          <NestItem isHighlight accent="neutral" title="Vite">
            <p class="leading-relaxed text-lg">Bundler</p>
            <ul class="grid grid-cols-3 gap-2 pt-5">
              <NestItem title="Nitro V3" accent="pink">
                <p>Deployment</p>
              </NestItem>
              <NestItem title="Netlify Vite Plugin" accent="teal">
                <p>Deployment</p>
              </NestItem>
              <NestItem title="Cloudflare Vite Plugin" accent="yellow">
                <p>Deployment</p>
              </NestItem>
            </ul>
          </NestItem>

          <NestItem accent="neutral" title="Router Agnostic">
            <ul class="grid grid-cols-2 gap-2 pt-5">
              <NestItem title="Solid Router" accent="cyan">
                <p>Official router</p>
              </NestItem>
              <NestItem title="Tanstack Router" accent="emerald">
                <p>Third party router</p>
              </NestItem>
            </ul>
          </NestItem>
        </NesterBox>
        <div class="w-full grid place-items-center overflow-x-hidden">
          <LegoSVG />
        </div>
      </div>
    </section>
  );
}
