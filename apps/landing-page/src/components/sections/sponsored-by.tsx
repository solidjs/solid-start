import { SectionTitle } from "../ui/section-title";

export function SponsoredBy() {
  return (
    <section class="pt-32 w-full md:max-w-7xl mx-auto flex flex-row justify-center items-center gap-32 relative">
      <header class="text-left w-1/3">
        <SectionTitle stylesOverride="text-left">Anomaly Innovations</SectionTitle>
        <p class="pt-5 px-2 leading-relaxed max-w-[70ch] mx-auto dark:font-thin text-lg">
          Thank you to our official partner who accelerate our development.
        </p>
      </header>
      <div class="grid place-items-center gap-4 sm:gap-6">
        <a href="https://anoma.ly/" target="_blank" rel="noopener">
          <img src="/anomaly-logo.png" alt="Anomaly Innovations" class="w-32 h-32" />
        </a>
      </div>
    </section>
  );
}
