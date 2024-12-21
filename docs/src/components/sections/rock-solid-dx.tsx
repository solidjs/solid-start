import { BentoBox, BentoItem } from "../bento";
import { SectionTitle } from "../ui/section-title";

export function RockSolidDX() {
  return (
    <section class="max-w-5xl w-full mx-auto relative group pt-12">
      <header class="pb-10">
        <SectionTitle stylesOverride="group-hover:shiny-text">
          Rock-Solid Developer Experience
        </SectionTitle>
        <p class="leading-relaxed max-w-[50ch] mx-auto text-center dark:font-thin text-md">
          (pun intended)
        </p>
      </header>
      <BentoBox>
        <BentoItem isHighlight accent="pink" title="Single-Flight Mutations">
          <p class="text-lg pt-4">
            Avoid waterfalls when updating data on the server.
          </p>
          <p class="text-lg pt-4">
            E.g.: when updating your view after a mutation, SolidStart will
            prevent a waterfall even if a navigation is triggered by the
            mutation. New data comes on the same flight as the mutation
            response.
          </p>
        </BentoItem>
        <BentoItem accent="lime" title="Request & Resource Deduplication">
          <p class="text-lg pt-4">
            During a roundtrip 2 identical requests never fly out, and 2
            identical resources are never serialized again.
          </p>
        </BentoItem>
        <BentoItem accent="emerald" title="Server Actions">
          <p>
            Form actions running on the server with code co-location and all the
            bells, whisltles, and whimsy you need.
          </p>
        </BentoItem>
        <BentoItem accent="teal" title="Server Functions">
          <p>
            Also known as Lambda Functions, SolidStart can create these API
            endpoints automatically, just as any other route.
          </p>
        </BentoItem>
        <BentoItem
          accent="cyan"
          title={
            <span>
              Data <span class="opacity-70">(pre-)</span>Loading
            </span>
          }
        >
          <p>
            Strongly parallelized data loading, easily define preloading
            strategies and empower your users with the snappiest UX they can
            imagine!
          </p>
        </BentoItem>
      </BentoBox>
    </section>
  );
}
