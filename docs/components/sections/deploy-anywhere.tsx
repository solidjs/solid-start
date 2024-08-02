import { Index } from "solid-js";
import { AwsLogo } from "../icons/platform/aws-logo";
import { AzureLogo } from "../icons/platform/azure-logo";
import { BunLogo } from "../icons/platform/bun-logo";
import { CloudflareLogo } from "../icons/platform/cloudflare-logo";
import { DenoLogo } from "../icons/platform/deno-logo";
import { NetlifyLogo } from "../icons/platform/netlify-logo";
import { Vercel } from "../icons/platform/vercel-logo";
import { SectionTitle } from "../ui/section-title";

const PLATFORMS = [
  {
    name: "Cloudflare",
    url: "https://www.cloudflare.com/",
    icon: <CloudflareLogo class="grayscale group-hover:grayscale-0  w-full  aspect-auto" />
  },
  {
    name: "Netlify",
    url: "https://www.netlify.com/",
    icon: <NetlifyLogo class="grayscale group-hover:grayscale-0  w-full h-full aspect-auto" />
  },

  {
    name: "Vercel",
    url: "https://vercel.com/",
    icon: (
      <Vercel class="fill-neutral-500 dark:group-hover:fill-white group-hover:fill-black  w-full h-full aspect-auto " />
    )
  },
  {
    name: "Bun",
    url: "https://bun.sh/",
    icon: <BunLogo class="grayscale group-hover:grayscale-0  w-full h-full aspect-auto" />
  },
  {
    name: "Deno",
    url: "https://deno.land/",
    icon: <DenoLogo class="grayscale group-hover:grayscale-0  w-full h-full aspect-auto" />
  },
  {
    name: "AWS",
    url: "https://aws.amazon.com/",
    icon: <AwsLogo class="grayscale group-hover:grayscale-0  w-full h-full aspect-auto" />
  },
  {
    name: "Azure",
    url: "https://azure.microsoft.com/",
    icon: <AzureLogo class="grayscale group-hover:grayscale-0  w-full h-full aspect-auto" />
  }
];

export function DeployAnywhere() {
  return (
    <section class="max-w-5xl pt-12 w-full mx-auto relative">
      <header>
        <SectionTitle>Deploy Anywhere</SectionTitle>
        <p class="pt-5 px-2 leading-relaxed max-w-[70ch] mx-auto text-center dark:font-thin text-lg">
          On the shoulders of open-source. SolidStart can be deployed to every platform Nitro has a
          preset for.
        </p>
      </header>
      <div class="mx-auto w-fit pt-12">
        <pre class="bg-gradient-to-tr px-4 py-14 sm:p-14 dark:from-sky-950/20 dark:to-sky-800/20 from-sky-50 to-sky-100 dark:shadow-[0px_0px_35px_rgb(125,211,252,0.10)] ring-1 ring-sky-950 relative rounded-md">
          <div
            id="upper-line"
            class="absolute -top-px left-20 right-11 h-px bg-gradient-to-r from-blue-300/0 via-blue-300/70 to-blue-300/0 animate-bounce"
          ></div>
          <div
            id="bottom-line"
            class="absolute -bottom-px left-11 right-20 h-px bg-gradient-to-r from-blue-400/0 via-blue-800 dark:via-blue-400 to-blue-400/0 animate-bounce"
          ></div>
          <code>
            <span class="dark:text-[#C792EA] text-purple-800">export default</span>{" "}
            <span class="dark:text-[#82AAFF] text-sky-950">defineConfig</span>
            <span class="dark:text-[#89DDFF] text-pink-600">{`({`}</span>
            <br />
            <span>
              {"    "}server{`: `}
            </span>
            <span class="dark:text-[#89DDFF]">{`{`}</span>
            <br />
            <span>
              {"        "}preset{`: `}
            </span>
            <span class="dark:text-[#89DDFF] text-pink-600">{`"`}</span>
            <span class="dark:text-[#C3E88D] text-rose-500">netlify</span>
            <span class="dark:text-[#89DDFF] text-pink-600">{`"`}</span>
            <br />
            <span class="dark:text-[#89DDFF] text-pink-600">
              {"    "}
              {`}`}
            </span>
            <br />
            <span class="dark:text-[#89DDFF] text-pink-600">{`})`}</span>
          </code>
        </pre>
      </div>
      <ul class="pt-16 grid grid-cols-2 place-items-center gap-4 sm:gap-6 md:grid-cols-3">
        <Index each={PLATFORMS}>
          {platform => (
            <li>
              <a
                class={`group size-36 sm:size-44 grid gap-5 place-items-center border-2 rounded-md py-4 px-2 hover:border-sky-950 dark:border-sky-950 border-sky-200 dark:hover:border-sky-200 z-10 relative`}
                href={platform().url}
                target="_blank"
                rel="noopener"
              >
                {platform().icon}
                <span class="text-sm">{platform().name}</span>
              </a>
            </li>
          )}
        </Index>
        <li>...and over 20 others!</li>
      </ul>
    </section>
  );
}
