import { JSX } from "solid-js";
import { SolidIcon } from "../icons/solid-logo";

function FooterSectionTitle(props: { children: JSX.Element }) {
  return <strong class="text-neutral-600 dark:text-neutral-200/40">{props.children}</strong>;
}

function FooterSectionLink(props: { href: string; children: JSX.Element }) {
  return (
    <a
      href={props.href}
      class="hover:border-b border-transparent border-dotted dark:hover:border-sky-200 hover:border-sky-950  transition-all duration-300"
      rel="noopener noreferrer"
      target="_blank"
    >
      {props.children}
    </a>
  );
}

export function Footer() {
  return (
    <footer class="w-full bg-gradient-to-b dark:from-sky-950 from-white  to-sky-400  dark:to-[#081924] pt-32 px-10 pb-10">
      <div class="max-w-5xl w-full mx-auto flex flex-col md:flex-row justify-between flex-wrap gap-10">
        <div class="pr-20 order-3 md:order-[unset]">
          <FooterSectionLink href="https://solidjs.com">
            <SolidIcon class="grayscale hover:grayscale-0 hover:opacity-80 dark:opacity-40 transition-all duration-300 w-16" />
          </FooterSectionLink>
          <div>
            <FooterSectionLink href="https://github.com/solidjs/solid-start/graphs/contributors"></FooterSectionLink>
          </div>
        </div>
        <div>
          <FooterSectionTitle>Resources</FooterSectionTitle>
          <ul class="flex flex-col gap-2 pt-4">
            <li>
              <FooterSectionLink href="https://primitives.solidjs.community">
                Solid Primitives
              </FooterSectionLink>
            </li>
            <li>
              <FooterSectionLink href="https://docs.solidjs.com/solid-start">
                Documentation
              </FooterSectionLink>
            </li>
          </ul>
        </div>
        <div>
          <FooterSectionTitle>Socials</FooterSectionTitle>
          <ul class="flex flex-col gap-2 pt-4">
            <li>
              <FooterSectionLink href="https://discord.gg/solidjs">Discord</FooterSectionLink>
            </li>

            <li>
              <FooterSectionLink href="https://x.com/solid_js">Twitter / 𝕏</FooterSectionLink>
            </li>
            <li>
              <FooterSectionLink href="https://opencollective.com/solid">
                OpenCollective
              </FooterSectionLink>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
