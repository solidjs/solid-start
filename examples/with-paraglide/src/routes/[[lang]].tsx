import { A, RouteSectionProps, useLocation } from '@solidjs/router';
import { addLanguageToPath, getRawPathname, LangLink, useLang } from "~/lang/core";
import { For } from "solid-js";

export default function LangLayout(props: RouteSectionProps) {
  const { messages, availableLocales, locale } = useLang();
  return (
    <>
      {/* Navigation Header */}
      <nav>
        {/* Main Navigation Links */}
        <div class="nav-links">
          <LangLink href="/" activeClass="active" inactiveClass="inactive">
            {messages().menu_home()}
          </LangLink>

          <LangLink href="/about" activeClass="active" inactiveClass="inactive">
            {messages().menu_about()}
          </LangLink>
        </div>

        {/* Language Selector */}
        <div class="lang-selector">
          <For each={availableLocales}>
            {(lang) => (
              <A
                href={addLanguageToPath(getRawPathname(useLocation().pathname), lang)}
                aria-current={locale() === lang ? 'page' : undefined}
                aria-label={`Switch to ${lang.toUpperCase()}`}
              >
                {lang.toUpperCase()}
              </A>
            )}
          </For>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {props.children}
      </main>

    </>
  );
}
