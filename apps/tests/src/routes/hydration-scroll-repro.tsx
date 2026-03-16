import * as Collapsible from "@kobalte/core/collapsible";
import { A, useLocation } from "@solidjs/router";
import { ChevronDown } from "lucide-solid";
import { createEffect, createSignal, For, splitProps, type ParentProps } from "solid-js";
import { Title } from "../meta";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/hydration-scroll-repro", label: "Repro" },
] as const;

const cards = Array.from({ length: 24 }, (_, index) => index + 1);

function ScrollReproTrigger(
  props: ParentProps<Collapsible.CollapsibleTriggerProps & { class?: string }>,
) {
  const [local, rest] = splitProps(props, ["children", "class"]);

  return (
    <Collapsible.Trigger class={local.class} {...rest}>
      <span class="hydration-scroll-trigger-label">{local.children}</span>
      <ChevronDown class="hydration-scroll-chevron" data-testid="hydration-scroll-chevron" />
    </Collapsible.Trigger>
  );
}

function ScrollReproContent(
  props: ParentProps<Collapsible.CollapsibleContentProps & { class?: string }>,
) {
  const [local, rest] = splitProps(props, ["children", "class"]);

  return (
    <Collapsible.Content class={local.class} {...rest}>
      {local.children}
    </Collapsible.Content>
  );
}

export default function HydrationScrollRepro() {
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = createSignal(false);

  createEffect(() => {
    location.pathname;
    setIsMobileNavOpen(false);
  });

  return (
    <div class="hydration-scroll-root">
      <Title>Hydration Scroll Repro</Title>
      <div class="hydration-scroll-shell">
        <div class="hydration-scroll-frame">
          <header class="hydration-scroll-header">
            <Collapsible.Root open={isMobileNavOpen()} onOpenChange={setIsMobileNavOpen}>
              <div class="hydration-scroll-header-row">
                <A href="/" class="hydration-scroll-brand">
                  Alpha Shell Repro
                </A>

                <nav aria-label="Desktop navigation" class="hydration-scroll-desktop-nav">
                  <For each={navigation}>{item => <A href={item.href}>{item.label}</A>}</For>
                </nav>

                <ScrollReproTrigger
                  class="hydration-scroll-trigger"
                  aria-label="Toggle navigation menu"
                  data-testid="hydration-scroll-trigger"
                >
                  Menu
                </ScrollReproTrigger>
              </div>

              <ScrollReproContent class="hydration-scroll-panel">
                <nav aria-label="Mobile navigation" class="hydration-scroll-mobile-nav">
                  <For each={navigation}>{item => <A href={item.href}>{item.label}</A>}</For>
                </nav>
              </ScrollReproContent>
            </Collapsible.Root>
          </header>

          <main class="hydration-scroll-main">
            <section class="hydration-scroll-hero">
              <p class="hydration-scroll-eyebrow">SolidStart hydration regression guard</p>
              <h1>Scroll after first load and watch for hydration warnings.</h1>
              <p>
                This route keeps the reproduction focused on a sticky shell, a Kobalte collapsible
                trigger, and the Lucide chevron icon rendered inside that trigger.
              </p>
            </section>

            <section class="hydration-scroll-stack">
              <For each={cards}>
                {card => (
                  <article class="hydration-scroll-panel-card">
                    <h2>Scroll target {card}</h2>
                    <p>
                      The page is intentionally tall so the first vertical scroll happens after
                      hydration has started and the sticky shell stays mounted while the page moves.
                    </p>
                  </article>
                )}
              </For>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
