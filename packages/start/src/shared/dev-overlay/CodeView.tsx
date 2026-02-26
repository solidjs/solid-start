// @refresh skip
import { type BuiltinLanguage, getSingletonHighlighter, type Highlighter } from "shiki";
import { loadWasm } from "shiki/engine/oniguruma";
import langJS from "shiki/langs/javascript.mjs";
import langJSX from "shiki/langs/jsx.mjs";
import langTSX from "shiki/langs/tsx.mjs";
import langTS from "shiki/langs/typescript.mjs";
import url from "shiki/onig.wasm?url";
import darkPlus from "shiki/themes/dark-plus.mjs";
import { createEffect, createResource, type JSX } from "solid-js";

let HIGHLIGHTER: Highlighter;

async function loadHighlighter() {
  if (!HIGHLIGHTER) {
    await loadWasm(await fetch(url));
    HIGHLIGHTER = await getSingletonHighlighter({
      themes: [darkPlus],
      langs: [langJS, langJSX, langTS, langTSX],
    });
  }
  return HIGHLIGHTER;
}

export interface CodeViewProps {
  fileName: string;
  content: string;
  line: number;
}

const RANGE = 8;

export function CodeView(props: CodeViewProps): JSX.Element | null {
  const lines = () =>
    props.content.split("\n").map((item, index) => ({
      index: index + 1,
      line: item,
    }));

  const minLine = () => Math.max(props.line - (1 + RANGE), 0);
  const maxLine = () => Math.min(props.line + RANGE, lines().length - 1);

  let ref: HTMLDivElement | undefined;

  const [data] = createResource(
    () =>
      lines()
        .slice(minLine(), maxLine())
        .map(item => item.line)
        .join("\n"),
    async value => {
      const highlighter = await loadHighlighter();
      const fileExtension = props.fileName.split(/[#?]/)[0]!.split(".").pop()?.trim();
      let lang = fileExtension as BuiltinLanguage;
      if (fileExtension === "mjs" || fileExtension === "cjs") {
        lang = "js";
      }
      return highlighter.codeToHtml(value, {
        theme: "dark-plus",
        lang,
      });
    },
  );

  createEffect(() => {
    const result = data();
    if (ref && result) {
      ref.innerHTML = result;

      const lines = ref.querySelectorAll('span[class="line"]');

      for (let i = 0, len = lines.length; i < len; i++) {
        const el = lines[i] as HTMLElement;
        if (props.line - minLine() - 1 === i) {
          el.dataset.startDevOverlayErrorLine = '';
        }
      }
    }
  });

  return (
    <div
      ref={ref}
      data-start-dev-overlay-code-view
      style={{
        "--dev-overlay-code-view-start": minLine() + 1,
      }}
    />
  );
}
